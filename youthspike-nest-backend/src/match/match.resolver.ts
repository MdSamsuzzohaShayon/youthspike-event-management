/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConfigService } from '@nestjs/config';
import { Args, Field, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Round } from 'src/round/round.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { MatchService } from './match.service';
import { NetService } from 'src/net/net.service';
import { RoundService } from 'src/round/round.service';
import { TeamService } from 'src/team/team.service';
import { UserRole } from 'src/user/user.schema';
import { Match } from './match.schema';
import { CreateMatchInput, UpdateMatchInput } from './match.input';

@ObjectType()
class GetMatchesResponse extends AppResponse<Match[]> {
  @Field((type) => [Match], { nullable: false })
  data?: Match[];
}

@ObjectType()
class GetMatchResponse extends AppResponse<Match> {
  @Field((type) => Match, { nullable: false })
  data?: Match;
}

@Resolver((of) => Match)
export class MatchResolver {
  constructor(
    private matchService: MatchService,
    private teamService: TeamService,
    private eventService: EventService,
    private roundService: RoundService,
    private netService: NetService,
    private configService: ConfigService,
    private userService: UserService,
  ) { }

  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetMatchResponse)
  async createMatch(@Args('input') input: CreateMatchInput): Promise<GetMatchResponse> {
    try {
      /**
       * TODO:
       *    Step-1: Find default properties from event and Create a new match
       *    Step-2: Create number of rounds through loop
       *    Step-3: Create number of nets through loop
       *    Step-4: Update Match with with netId and roundId
       *    Step-5: Update Match with eventId
       */
      const findEvent = await this.eventService.findById(input.event.toString());
      if (!findEvent) return AppResponse.notFound('Event');

      const netIds = [];
      const roundIds = [];
      const playerIds = [];

      const matchObj: any = {
        ...input,
        nets: netIds, rounds: roundIds, players: playerIds,
      };
      if (!matchObj.divisions) matchObj.divisions = findEvent.divisions;
      if (!matchObj.numberOfNets) matchObj.numberOfNets = findEvent.nets;
      if (!matchObj.numberOfRounds) matchObj.numberOfRounds = findEvent.rounds;
      if (!matchObj.playerLimit) matchObj.playerLimit = findEvent.playerLimit;
      if (!matchObj.netVariance) matchObj.netVariance = findEvent.netVariance;
      if (!matchObj.homeTeam) matchObj.homeTeam = findEvent.homeTeam;
      if (!matchObj.autoAssign) matchObj.autoAssign = findEvent.autoAssign;
      if (!matchObj.autoAssignLogic) matchObj.autoAssignLogic = findEvent.autoAssignLogic;
      if (!matchObj.rosterLock) matchObj.rosterLock = findEvent.rosterLock;
      if (!matchObj.timeout) matchObj.timeout = findEvent.timeout;
      if (!matchObj.coachPassword) matchObj.coachPassword = findEvent.coachPassword;
      if (!matchObj.location) matchObj.location = findEvent.location;


      const newMatch = await this.matchService.create(matchObj);

      const promisesAll = [];

      // Create Round
      for (let i = 0; i < input.numberOfRounds; i += 1) {
        const netObjs = [];
        const newRound = {
          match: newMatch._id,
          num: i + 1,
          nets: [], // Will be populated later
        };
        const round = await this.roundService.create(newRound);
        roundIds.push(round._id);

        // Create net
        for (let j = 0; j < input.numberOfNets; j += 1) {
          const netObj = {
            match: newMatch._id,
            round: round._id,
            num: j + 1,
            points: 1,
            teamAScore: 0,
            teamBScore: 0,
            pairRange: 0,
          };
          netObjs.push(netObj);
        }

        const nets = await this.netService.createMany(netObjs);
        const netIdsOfRound = nets.map((n) => n._id);
        netIds.push(...netIdsOfRound);

        // Update the nets field in the created round
        promisesAll.push(this.roundService.update({ nets: netIdsOfRound }, round._id));
      }
      promisesAll.push(this.teamService.update({ match: newMatch._id }, { _id: input.teamA }));
      promisesAll.push(this.teamService.update({ match: newMatch._id }, { _id: input.teamB }));
      promisesAll.push(this.eventService.update({ matches: [newMatch._id] }, input.event));
      promisesAll.push(this.matchService.update({ nets: netIds, rounds: roundIds }, newMatch._id));
      await Promise.all(promisesAll);

      return {
        data: newMatch,
        success: true,
        code: 201,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetMatchResponse)
  async updateMatch(@Args('input') input: UpdateMatchInput, @Args('matchId') matchId: string) {
    try {
      /**
       * TODO:
       *    Step-1: Create new nets or delete if nets number changes
       *    Step-2: Create new rounds or delete if rounds number changes
       */
      const updatedMatch = await this.matchService.update(input, matchId);
      return {
        data: updatedMatch,
        success: true,
        code: 200,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => GetMatchesResponse)
  async getMatches(@Args('eventId', { nullable: true }) eventId?: string | null) {
    try {
      const query: { eventId?: null | string } = {};
      if (eventId) query.eventId = eventId;

      // Assuming matchService is injected in your class
      const matches = await this.matchService.query(query);

      return {
        code: 200,
        success: true,
        data: matches,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }
  

  @Query((returns) => GetMatchResponse)
  async getMatch(@Args('matchId') matchId: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.matchService.findById(matchId),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  /**
   * Resolve Fields
   * =============================================================================================
   */
  @ResolveField()
  async teamA(@Parent() match: Match) {
    try {
      if (!match.teamA) return null;
      return this.teamService.findById(match.teamA.toString());
    } catch {
      return null;
    }
  }

  @ResolveField()
  async teamB(@Parent() match: Match) {
    try {
      if (!match.teamB) return null;
      return this.teamService.findById(match.teamB.toString());
    } catch {
      return null;
    }
  }

  @ResolveField((returns) => [Round])
  async rounds(@Parent() match: Match) {
    try {
      return this.roundService.query({ match: match._id.toString() });
    } catch {
      return [];
    }
  }

  @ResolveField((returns) => [Round])
  async nets(@Parent() match: Match) {
    try {
      return this.netService.query({ match: match._id.toString() });
    } catch {
      return [];
    }
  }

  @ResolveField()
  async event(@Parent() match: Match) {
    try {
      return this.eventService.findById(match.event.toString());
    } catch {
      return null;
    }
  }
}
