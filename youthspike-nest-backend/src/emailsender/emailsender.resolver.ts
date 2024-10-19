import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { EventService } from 'src/event/event.service';
import { PlayerService } from 'src/player/player.service';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { TeamService } from 'src/team/team.service';
import { EmailsenderService } from './emailsender.service';
import { LdoService } from 'src/ldo/ldo.service';
import { UserService } from 'src/user/user.service';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';
import { tokenToUser } from 'src/util/helper';

@Resolver()
export class EmailsenderResolver {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private emailsenderService: EmailsenderService,
    private ldoService: LdoService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  /**
   * Format a date into a custom string.
   * @param date The input date to be formatted.
   * @returns A formatted date string (e.g., '01 January 2024').
   */
  private formatDateToCustomString(date: string): string {
    // Create a Date object from the ISO string
    const newDate = new Date(date);

    // Options for formatting
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric' as const,
      month: 'long' as const,
      day: '2-digit' as const,
    };

    // Convert to formatted string
    const formattedDate = newDate.toLocaleDateString('en-US', options);

    return formattedDate;
  }

  /**
   * Send credentials to team members for an event.
   * @param eventId The ID of the event.
   * @param teamId (Optional) The ID of the specific team to send credentials to.
   * @param captain (Optional) The email of the captain to send credentials to.
   * @param co_captain (Optional) The email of the co-captain to send credentials to.
   * @returns An AppResponse indicating the result of the operation.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => AppResponse)
  async sendCredentials(
    @Context() context: any,
    @Args('eventId') eventId: string,
    @Args('teamId', { nullable: true }) teamId?: string,
    @Args('captain', { nullable: true }) captain?: string,
    @Args('co_captain', { nullable: true }) co_captain?: string,
  ): Promise<AppResponse> {
    try {
      const sendPromises: Promise<void>[] = [];

      // Retrieve event details
      const eventExist = await this.eventService.findById(eventId);
      if (!eventExist) {
        return AppResponse.notFound('Event');
      }
      const subject = `Credentials for ${eventExist.name}`;
      const htmlFileName = 'send-credentials.html';

      const ldoExist = await this.ldoService.findByDirectorId(eventExist.ldo.toString());
      const directorExist = await this.userService.findById(ldoExist.director.toString());

      // Check user role
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);
      if (!userId) return AppResponse.unauthorized();

      const loggedUser = await this.userService.findById(userId);
      if (!loggedUser) return AppResponse.unauthorized();
      let ldoIdUrl = '';

      if (loggedUser.role === UserRole.admin) {
        ldoIdUrl = `?ldoId=${ldoExist.director.toString()}`;
      }

      // Prepare list of recipients based on specified parameters
      const recipients: string[] = [];
      if (teamId) {
        // Send credentials to specific team
        const team = await this.teamService.findById(teamId);
        if (!team) {
          return AppResponse.notFound('Team');
        }
        if (team.captain) {
          recipients.push(team.captain.toString());
        }
        if (team.cocaptain) {
          recipients.push(team.cocaptain.toString());
        }
      } else {
        // Send credentials to captains and co-captains of all teams in the event
        const teams = await this.teamService.query({ _id: { $in: eventExist.teams } });
        for (const team of teams) {
          if (team.captain) {
            recipients.push(team.captain.toString());
          }
          if (team.cocaptain) {
            recipients.push(team.cocaptain.toString());
          }
        }
      }

      // Send emails to recipients
      for (const recipient of recipients) {
        const player = await this.playerService.findById(recipient);
        if (player) {
          const sendTo = [player.email];
          if (this.configService.get<string>('NODE_ENV') === 'development') {
            sendTo.push('mdsamsuzzoha5222@gmail.com');
          }
          const eventDateFormatted = this.formatDateToCustomString(eventExist.startDate);
          sendPromises.push(
            this.emailsenderService.sendHtmlEmail({
              to: sendTo,
              subject,
              htmlFileName,
              player_username: player.username,
              coach_password: eventExist.coachPassword,
              ldo_name: ldoExist.name,
              director_email: directorExist.email,
              captain_name: player.firstName,
              event_date: eventDateFormatted,
              fwango_link: eventExist.fwango,
              ldo_phone: ldoExist.phone,
              eventId: eventExist._id,
              ldoIdUrl,
            }),
          );
        }
      }

      // Update event or team to mark credentials as sent
      if (teamId) {
        await this.teamService.updateOne({ _id: teamId }, { $set: { sendCredentials: true } });
      } else {
        await this.eventService.updateOne({ _id: eventId }, { $set: { sendCredentials: true } });
      }

      await Promise.all(sendPromises);

      return {
        code: HttpStatus.OK,
        message: `Credentials have been sent via email`,
        success: true,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
