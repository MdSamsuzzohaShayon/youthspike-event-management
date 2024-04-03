/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { EActionProcess, ETeam, Round } from 'src/round/round.schema';
import { Roles } from 'src/shared/auth/roles.decorator';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { MatchService } from './match.service';
import { NetService } from 'src/net/net.service';
import { RoundService } from 'src/round/round.service';
import { TeamService } from 'src/team/team.service';
import { UserRole } from 'src/user/user.schema';
import { Match } from './match.schema';
import { CreateMatchInput, FilterQueryInput, UpdateMatchInput } from './match.input';
import { RoomService } from 'src/room/room.service';
import { ETieBreaker } from 'src/net/net.schema';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';

@ObjectType()
class GetMatchesResponse extends AppResponse<Match[]> {
  @Field((type) => [Match], { nullable: false })
  data?: Match[];
}

@ObjectType()
class GetMatchResponse extends AppResponse<Match> {
  @Field((type) => Match, { nullable: true })
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
    private roomService: RoomService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetMatchResponse)
  async createMatch(@Args('input') input: CreateMatchInput): Promise<GetMatchResponse> {
    try {
      const eventExist = await this.eventService.findById(input.event.toString());
      if (!eventExist) return AppResponse.notFound('Event');

      const netIds = [];
      const roundIds = [];
      const playerIds = [];

      const matchObj: any = {
        ...input,
        nets: netIds, rounds: roundIds, players: playerIds,
      };
      if (!matchObj.division || !eventExist.divisions.toLowerCase().includes(matchObj.division.trim().toLowerCase())) return AppResponse.notFound('Event');
      if (!matchObj.numberOfNets) matchObj.numberOfNets = eventExist.nets;
      if (!matchObj.numberOfRounds) matchObj.numberOfRounds = eventExist.rounds;
      if (!matchObj.playerLimit) matchObj.playerLimit = eventExist.playerLimit;
      if (!matchObj.netVariance) matchObj.netVariance = eventExist.netVariance;
      if (!matchObj.homeTeam) matchObj.homeTeam = eventExist.homeTeam;
      if (!matchObj.autoAssign) matchObj.autoAssign = eventExist.autoAssign;
      if (!matchObj.autoAssignLogic) matchObj.autoAssignLogic = eventExist.autoAssignLogic;
      if (!matchObj.rosterLock) matchObj.rosterLock = eventExist.rosterLock;
      if (!matchObj.timeout) matchObj.timeout = eventExist.timeout;
      if (!matchObj.location) matchObj.location = eventExist.location;

      const newRoom = await this.roomService.create({ teamA: input.teamA, teamB: input.teamB })
      const newMatch = await this.matchService.create({ ...matchObj, room: newRoom._id });

      const promisesAll = [];

      let firstPlacing = ETeam.teamA;
      // ===== Create Round and nets inside a round ===== 
      for (let i = 0; i < input.numberOfRounds; i += 1) {
        const netObjs = [];
        const newRound = {
          match: newMatch._id,
          num: i + 1,
          nets: [], // Will be populated later
          players: playerIds,
          teamAProcess: i === 0 ? EActionProcess.INITIATE : EActionProcess.CHECKIN, // From the second round captain does not need to check in once again
          teamBProcess: i === 0 ? EActionProcess.INITIATE : EActionProcess.CHECKIN,
          subs: [],
          firstPlacing,
          completed: false
        };
        const round = await this.roundService.create(newRound);
        firstPlacing = firstPlacing === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
        roundIds.push(round._id);

        // ===== Create net ===== 
        for (let j = 0; j < input.numberOfNets; j += 1) {
          const netObj = {
            match: newMatch._id,
            round: round._id,
            num: j + 1,
            points: 1,
            // For last round net make points more than 1
            netType: input.numberOfRounds === i + 1 ? ETieBreaker.FINAL_ROUND_NET : ETieBreaker.PREV_NET,
            teamAScore: null,
            teamBScore: null,
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
      promisesAll.push(this.teamService.update({ $addToSet: { matches: newMatch._id } }, { _id: input.teamA }));
      promisesAll.push(this.teamService.update({ $addToSet: { matches: newMatch._id } }, { _id: input.teamB }));
      promisesAll.push(this.roomService.update({ _id: newRoom._id }, { match: newMatch._id }));
      promisesAll.push(this.eventService.update({ matches: [newMatch._id] }, input.event));
      promisesAll.push(this.matchService.update({ nets: netIds, rounds: roundIds }, newMatch._id));
      await Promise.all(promisesAll);

      return {
        data: newMatch,
        code: HttpStatus.CREATED,
        success: true,
        message: 'Match Created successfully!',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetMatchResponse)
  async updateMatch(@Args('input') input: UpdateMatchInput, @Args('matchId') matchId: string) {
    try {
      const updatedMatch = await this.matchService.update(input, matchId);
      return {
        data: updatedMatch,
        message: 'Match Updated successfully!',
        code: HttpStatus.ACCEPTED,
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetMatchResponse)
  async deleteMatch(@Args('matchId') matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);
      if (!matchExist) return AppResponse.notFound("Match");

      const updatePromises = [];
      const roundIds = matchExist.rounds.map((m) => m.toString());
      if (roundIds.length > 0) {
        updatePromises.push(this.roundService.deleteMany({ _id: { $in: roundIds } }));
      }
      const netIds = matchExist.nets.map((n) => n.toString());
      if (netIds.length > 0) {
        updatePromises.push(this.roundService.deleteMany({ _id: { $in: netIds } }));
      }

      updatePromises.push(this.teamService.updateOne({ _id: matchExist.teamA }, { $pull: { matches: matchExist._id } }));
      updatePromises.push(this.teamService.updateOne({ _id: matchExist.teamB }, { $pull: { matches: matchExist._id } }));
      updatePromises.push(this.roomService.deleteOne({ _id: matchExist.room }));
      updatePromises.push(this.matchService.delete({ _id: matchId }));
      await Promise.all(updatePromises);
      return {
        data: null,
        code: HttpStatus.NO_CONTENT,
        message: 'Match Deleted successfully!',
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((returns) => GetMatchesResponse)
  async getMatches(@Args('filter', { nullable: true }) filter?: FilterQueryInput) {
    try {

      // Assuming matchService is injected in your class
      const matches = await this.matchService.find(filter);

      return {
        code: HttpStatus.OK,
        success: true,
        message: "List of matches",
        data: matches,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  @Query((returns) => GetMatchResponse)
  async getMatch(@Args('matchId') matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId)
      return {
        code: matchExist ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: matchExist ? true : false,
        message: 'No match found!',
        data: matchExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
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

  @ResolveField()
  async room(@Parent() match: Match) {
    try {
      if (!match.room) return null;
      const findRoom = await this.roomService.findOne({ _id: match.room.toString() });
      return findRoom;
    } catch {
      return null;
    }
  }
}
