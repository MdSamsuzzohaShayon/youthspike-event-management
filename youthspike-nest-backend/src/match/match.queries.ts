import { HttpStatus, Injectable, Query } from "@nestjs/common";
import { MatchService } from "./match.service";
import { EventService } from "src/event/event.service";
import { TeamService } from "src/team/team.service";
import { LdoService } from "src/ldo/ldo.service";
import { GroupService } from "src/group/group.service";
import { RoundService } from "src/round/round.service";
import { NetService } from "src/net/net.service";
import { FilterQueryInput } from "./match.input";
import { AppResponse } from "src/shared/response";

@Injectable()
export class MatchQueries{

    constructor(
        private readonly matchService: MatchService,
        private readonly eventService: EventService,
        private readonly teamService: TeamService,
        private readonly ldoService: LdoService,
        private readonly groupService: GroupService,
        private readonly roundService: RoundService,
        private readonly netService: NetService,
      ) {}

//   @Query((_returns) => GetMatchesResponse)
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

//   @Query((_returns) => GetEventWithMatchesResponse)
  async getEventWithMatches(eventId: string) {
    try {
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

//   @Query((returns) => GetMatchResponse)
  async getMatch( matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);

      return {
        code: matchExist ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: matchExist ? true : false,
        message: matchExist ? 'Got the match' : 'No match found!',
        data: matchExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
  // match, serverReceiverSinglePlay, serverReceiverOnNet, room, event, sponsors, ldo, rounds, subs, nets

}