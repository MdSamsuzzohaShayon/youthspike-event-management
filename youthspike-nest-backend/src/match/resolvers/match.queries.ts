import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { MatchService } from 'src/match/match.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';

// import { IMatchQueries } from '../resolvers/event.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FilterQueryInput } from './match.input';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { ConfigService } from '@nestjs/config';
import { tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { ETieBreakingStrategy } from 'src/event/event.schema';

// IMatchQueries

@Injectable()
export class MatchQueries {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private matchService: MatchService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
  ) {}

  async getMatches(filter?: FilterQueryInput) {
    try {
      // Assuming matchService is injected in your class
      const matches = await this.matchService.find(filter);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of matches',
        data: matches,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getEventWithMatches(context: any, eventId: string) {
    try {
      // Return any one of them between player and event
      // const secret = this.configService.get<string>('JWT_SECRET');
      // const userPayload = tokenToUser(context, secret);

      // // Get user
      // const loggedUser = await this.userService.findById(userPayload?._id);
      // if (!loggedUser) return AppResponse.unauthorized();

      // Assuming matchService is injected in your class
      const [event, matches, teams, ldo, groups] = await Promise.all([
        this.eventService.findById(eventId),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.groupService.find({ event: eventId }),
      ]);

      // Net is not adding in the team
      const matchIds = matches.map((m) => m._id.toString());
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get details of event, matches, teams, ldo, groups, rounds, nets',
        data: { event, matches, teams, ldo, groups, rounds, nets },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getMatch(matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);

      if (!matchExist) return AppResponse.notFound('Match');

      // Auto-complete match if all nets have scores (even 0 is valid)
      /*
      if (!matchExist.completed) {
        // Find nets that are missing scores
        const incompleteNets = await this.netService.find({
          match: matchExist._id,
          $or: [{ teamAScore: null }, { teamBScore: null }],
        });

        // If no incomplete nets, mark match as completed
        if (incompleteNets.length === 0) {
          if (matchExist.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND) {
            if (matchExist.extendedOvertime) {
              await this.matchService.updateOne({ _id: matchExist._id }, { $set: { completed: true } });
              matchExist.completed = true; // update local object
            }
          } else {
            await this.matchService.updateOne({ _id: matchExist._id }, { $set: { completed: true } });
            matchExist.completed = true; // update local object
          }
        }
      }
        */

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Got the match',
        data: matchExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
