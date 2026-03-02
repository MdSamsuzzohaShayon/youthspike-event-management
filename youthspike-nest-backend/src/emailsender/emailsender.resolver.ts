// ─────────────────────────────────────────────────────────────
// emailsender.resolver.ts
// Updated sendCredentials:
//   1. Fetches the event's linked Template from DB
//   2. Builds the placeholder values map for each recipient
//   3. Calls emailSenderService.sendTemplateEmail() (DB template path)
//   Falls back to the legacy HTML file if no template is attached.
// ─────────────────────────────────────────────────────────────

import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { EventService } from 'src/event/event.service';
import { PlayerService } from 'src/player/player.service';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { TeamService } from 'src/team/team.service';
import { EmailsenderService, ITemplateValues } from './emailsender.service';
import { LdoService } from 'src/ldo/ldo.service';
import { UserService } from 'src/user/user.service';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';
import { formatDate, isISODateString, tokenToUser } from 'src/utils/helper';
import { EEnv, NODE_ENV } from 'src/utils/keys';
import { TemplateService } from 'src/template/template.service';
import { ETemplateType } from 'src/template/template.schema';

@Resolver()
export class EmailsenderResolver {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private emailSenderService: EmailsenderService,
    private ldoService: LdoService,
    private userService: UserService,
    private templateService: TemplateService,
    private configService: ConfigService,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────

  private formatDateToCustomString(date: string): string {
    const newDate = new Date(date);
    return newDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  }

  /**
   * Build the full placeholder values map for a given player + event context.
   * Keys must match exactly what was used in the template editor.
   */
  private buildTemplateValues({
    playerUsername,
    captainName,
    coachPassword,
    ldoName,
    ldoDirectorName,
    directorEmail,
    ldoPhone,
    eventName,
    eventDate,
    rosterLockDate,
    frontendUrl,
    adminClientUrl,
    fwangoUrl,
    americanSpikersUrl,
  }: {
    playerUsername: string;
    captainName: string;
    coachPassword: string;
    ldoName: string;
    ldoDirectorName: string;
    directorEmail: string;
    ldoPhone?: string | null;
    eventName: string;
    eventDate: string;
    rosterLockDate: string;
    frontendUrl: string;
    adminClientUrl: string;
    fwangoUrl: string;
    americanSpikersUrl: string;
  }): ITemplateValues {
    return {
      // Player
      player_username: playerUsername,
      captain: captainName,
      coach_password: coachPassword,

      // LDO / Director
      ldo_name: ldoName,
      ldo_director_name: ldoDirectorName,
      ldo_email: directorEmail,
      ldo_phone: ldoPhone ? `Phone: ${ldoPhone}` : '',

      // Event
      event_name: eventName,
      event_date: eventDate,
      roster_lock_date: rosterLockDate,

      // URLs
      frontend_url: frontendUrl,
      admin_client_url: adminClientUrl,
      fwango_url: fwangoUrl,
      american_spikers_url: americanSpikersUrl,
    };
  }

  // ── Mutation ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => AppResponse)
  async sendCredentials(
    @Context() context: any,
    @Args('eventId') eventId: string,
    @Args({ name: 'teamIds', type: () => [String], nullable: true }) teamIds: string[],
    @Args('captain', { nullable: true }) captain?: string,
    @Args('co_captain', { nullable: true }) co_captain?: string,
  ): Promise<AppResponse> {
    try {
      // ── 1. Fetch event ───────────────────────────────────
      const eventExist = await this.eventService.findById(eventId);
      if (!eventExist) return AppResponse.notFound('Event');

      // ── 2. Fetch LDO + Director ──────────────────────────
      const ldoExist = await this.ldoService.findByDirectorId(eventExist.ldo.toString());
      const directorExist = await this.userService.findById(ldoExist.director.toString());

      // ── 3. Auth check + ldoIdUrl ─────────────────────────
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);
      if (!userPayload?._id) return AppResponse.unauthorized();

      const loggedUser = await this.userService.findById(userPayload._id);
      if (!loggedUser) return AppResponse.unauthorized();

      const ldoIdUrl = loggedUser.role === UserRole.admin
        ? `?ldoId=${ldoExist.director.toString()}`
        : '';

      // ── 4. Resolve the email template ────────────────────
      //
      // Priority:
      //   a) Template linked to this event (first TEAM type template)
      //   b) Legacy HTML file fallback
      //
      // The event schema should ideally have a `template` ref.
      // We search by event ID and use the first match.
      let templateHtml: string | null = null;
      let emailSubject = `${eventExist.name} Captain's Login Credentials & Rankings`;

      const eventTemplates = await this.templateService.find({
        event: eventId,
        // Optionally filter by type: type: ETemplateType.TEAM
        type: ETemplateType.TEAM
      });

      // Get the last one as default
      const eventTemplate = eventTemplates.length > 0 ? eventTemplates[1] : null;

      if (eventTemplate) {
        templateHtml = eventTemplate.body; // compiled email-safe HTML from editor
        emailSubject = eventTemplate.subject || emailSubject;
      }

      // ── 5. Collect recipients ────────────────────────────
      const recipients: string[] = [];

      if (teamIds && teamIds.length > 0) {
        const teams = await this.teamService.find({ _id: { $in: teamIds } });
        if (!teams || teams.length === 0) return AppResponse.notFound('Teams');

        for (const team of teams) {
          if (team.captain) recipients.push(team.captain.toString());
          if (team.cocaptain) recipients.push(team.cocaptain.toString());
        }
      } else {
        const teams = await this.teamService.find({
          _id: { $in: eventExist.teams.map((t) => String(t)) },
        });
        for (const team of teams) {
          if (team.captain) recipients.push(team.captain.toString());
          if (team.cocaptain) recipients.push(team.cocaptain.toString());
        }
      }

      // ── 6. Shared context values (same for all recipients) ──
      const ADMIN_CLIENT_URL = this.configService.get<string>('ADMIN_CLIENT_URL');
      const FWANGO_URL = eventExist.fwango || this.configService.get<string>('FWANGO_URL');
      const AMERICAN_SPIKERS_URL = this.configService.get<string>('AMERICAN_SPIKERS_URL');
      const FRONTEND_URL = this.configService.get<string>('CLIENT_URL');

      const eventDateFormatted = this.formatDateToCustomString(eventExist.startDate);
      const rosterLockFormatted = isISODateString(eventExist.rosterLock)
        ? formatDate(eventExist.rosterLock)
        : eventExist.rosterLock;

      // ── 7. Send to each recipient ────────────────────────
      const sendPromises: Promise<void>[] = [];

      for (const recipientId of recipients) {
        const playerExist = await this.playerService.findById(recipientId);
        if (!playerExist) continue;

        const sendTo = [playerExist.email];
        if (NODE_ENV === EEnv.DEVELOPMENT) {
          sendTo.push('mdsamsuzzoha5222@gmail.com');
        }

        const adminClientUrl = `${ADMIN_CLIENT_URL}/${eventExist._id}/matches/${ldoIdUrl}`;

        const values = this.buildTemplateValues({
          playerUsername: playerExist.username,
          captainName: playerExist.firstName,
          coachPassword: eventExist.coachPassword,
          ldoName: ldoExist.name,
          ldoDirectorName: `${directorExist.firstName} ${directorExist.lastName}`,
          directorEmail: directorExist.email,
          ldoPhone: ldoExist.phone,
          eventName: eventExist.name,
          eventDate: eventDateFormatted,
          rosterLockDate: rosterLockFormatted,
          frontendUrl: FRONTEND_URL,
          adminClientUrl,
          fwangoUrl: FWANGO_URL,
          americanSpikersUrl: AMERICAN_SPIKERS_URL,
        });

        if (templateHtml) {
          // ── New path: render DB template ──────────────
          sendPromises.push(
            this.emailSenderService.sendTemplateEmail({
              to: sendTo,
              subject: emailSubject,
              templateHtml,
              values,
            }),
          );
        } else {
          // ── Legacy fallback: HTML file on disk ────────
          sendPromises.push(
            this.emailSenderService.sendHtmlEmail({
              to: sendTo,
              subject: emailSubject,
              htmlFileName: 'send-credentials.html',
              values,
            }),
          );
        }
      }

      // ── 8. Mark credentials as sent ──────────────────────
      if (teamIds && teamIds.length > 0) {
        await this.teamService.updateMany(
          { _id: { $in: teamIds } },
          { $set: { sendCredentials: true } },
        );
      } else {
        await this.eventService.updateOne(
          { _id: eventId },
          { $set: { sendCredentials: true } },
        );
      }

      await Promise.all(sendPromises);

      return {
        code: HttpStatus.OK,
        message: 'Credentials have been sent via email',
        success: true,
      };
    } catch (error) {
      console.error('[EmailsenderResolver] sendCredentials error:', error);
      return AppResponse.handleError(error);
    }
  }
}