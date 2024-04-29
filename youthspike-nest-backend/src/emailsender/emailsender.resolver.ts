import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { EventService } from 'src/event/event.service';
import { PlayerService } from 'src/player/player.service';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { TeamService } from 'src/team/team.service';
import * as path from 'path';
import { EmailsenderService } from './emailsender.service';

@Resolver()
export class EmailsenderResolver {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private emailsenderService: EmailsenderService,
  ) {}

  //   @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => AppResponse)
  async sendCredentials(
    @Args('eventId', { nullable: true }) eventId?: string,
    @Args('teamId', { nullable: true }) teamId?: string,
    @Args('captain', { nullable: true }) captain?: string,
    @Args('co_captain', { nullable: true }) co_captain?: string,
  ) {
    try {
      /**
       * Make a list of user detail
       *
       */
      console.log({ eventId, teamId, captain, co_captain });
      if (eventId) {
        const eventExist = await this.eventService.findById(eventId);
        if (!eventExist) return AppResponse.notFound('Event');

        const findTeams = await this.teamService.query({ _id: { $in: eventExist.teams } });
        const captainIds: string[] = [];
        const co_captainIds: string[] = [];

        for (let i = 0; i < findTeams.length; i += 1) {
          if (findTeams[i].captain) captainIds.push(findTeams[i].captain.toString());
          if (findTeams[i].cocaptain) co_captainIds.push(findTeams[i].cocaptain.toString());
        }

        const players = await this.playerService.query({ _id: { $in: [...captainIds, ...co_captainIds] } });
        const playerEmails = [...new Set([...players.map((p) => p.email && p.email)])];

        console.log('Send email to: ', playerEmails);

        const to = 'mdsamsuzzoha5222@gmail.com';
        const subject = 'Credentials for Your Event';

        // Send HTML email using dynamic values

        const htmlFilePath = path.join(__dirname, 'send-credentials.html');
        console.log({ htmlFilePath, __dirname });
        await this.emailsenderService.sendHtmlEmail(to, subject, 'send-credentials.html');
      }

      return {
        code: HttpStatus.OK,
        message: `Credentials has been sent via email`,
        success: true,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
