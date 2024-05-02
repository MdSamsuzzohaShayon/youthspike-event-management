import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
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

@Resolver()
export class EmailsenderResolver {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private emailsenderService: EmailsenderService,
    private ldoService: LdoService,
    private userService: UserService,
  ) {}

  /**
   * Format a date into a custom string.
   * @param date The input date to be formatted.
   * @returns A formatted date string (e.g., '01 January 2024').
   */
  private formatDateToCustomString(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };

    return new Intl.DateTimeFormat('en-GB', options).format(date);
  }

  /**
   * Send credentials to team members for an event.
   * @param eventId The ID of the event.
   * @param teamId (Optional) The ID of the specific team to send credentials to.
   * @param captain (Optional) The email of the captain to send credentials to.
   * @param co_captain (Optional) The email of the co-captain to send credentials to.
   * @returns An AppResponse indicating the result of the operation.
   */
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => AppResponse)
  async sendCredentials(
    @Args('eventId') eventId: string,
    @Args('teamId', { nullable: true }) teamId?: string,
    @Args('captain', { nullable: true }) captain?: string,
    @Args('co_captain', { nullable: true }) co_captain?: string,
  ): Promise<AppResponse> {
    try {
      const sendPromises: Promise<void>[] = [];
      const subject = 'Credentials for Your Event';
      const htmlFileName = 'send-credentials.html';

      // Retrieve event details
      const event = await this.eventService.findById(eventId);
      if (!event) {
        return AppResponse.notFound('Event');
      }

      const ldo = await this.ldoService.findByDirectorId(event.ldo.toString());
      const director = await this.userService.findById(ldo.director.toString());

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
        const teams = await this.teamService.query({ _id: { $in: event.teams } });
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
          const eventDateFormatted = this.formatDateToCustomString(event.startDate);
          sendPromises.push(
            this.emailsenderService.sendHtmlEmail({
              to: ['mdsamsuzzoha5222@gmail.com', player.email],
              subject,
              htmlFileName,
              player_username: player.username,
              coach_password: event.coachPassword,
              ldo_name: ldo.name,
              director_email: director.email,
              captain_name: player.firstName,
              event_date: eventDateFormatted,
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