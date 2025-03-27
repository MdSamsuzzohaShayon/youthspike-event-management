/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
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
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { GroupService } from 'src/group/group.service';
import { EventMatches, GetEventWithMatchesResponse, GetMatchesResponse, GetMatchResponse } from './match.response';
import { LdoService } from 'src/ldo/ldo.service';
import { SponsorService } from 'src/sponsor/sponsor.service';

@Resolver((of) => Match)
export class MatchResolver {
  constructor(
    private matchService: MatchService,
    private teamService: TeamService,
    private eventService: EventService,
    private roundService: RoundService,
    private netService: NetService,
    private roomService: RoomService,
    private playerService: PlayerService,
    private playerRankingService: PlayerRankingService,
    private groupService: GroupService,
    private ldoService: LdoService,
    private sponsorService: SponsorService,
  ) {}
  // ===== Healper Functions =====
  async deleteSingle(matchExist: Match) {
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
    updatePromises.push(this.matchService.delete({ _id: matchExist._id }));
    await Promise.all(updatePromises);
  }

  private async getTeamRanking(
    match: Match,
    teamId: string,
    rankingId: string,
    rankingField: string,
  ): Promise<PlayerRanking> {
    try {
      let playerRanking = await this.playerRankingService.findOne({ _id: rankingId });
      if (!playerRanking) {
        const teamExist = await this.teamService.findOne({ _id: teamId });
        const playerList = await this.playerService.find({ _id: { $in: teamExist.players } });
        const rankingData = {
          rankLock: false,
          team: teamExist._id,
          rankings: [],
          match: match._id,
        };
        const rankings = [];
        for (let pi = 0; pi < playerList.length; pi += 1) {
          rankings.push({ player: playerList[pi]._id, rank: pi + 1 });
        }
        rankingData.rankings = rankings;
        playerRanking = await this.playerRankingService.create(rankingData);
        await Promise.all([
          this.teamService.updateOne({ _id: teamExist._id }, { $addToSet: { playerRankings: playerRanking._id } }),
          this.matchService.updateOne({ _id: match._id }, { $set: { [rankingField]: playerRanking._id } }),
        ]);
      }
      return playerRanking;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

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

      const createPromises = [];

      if (!input.division || !eventExist.divisions.toLowerCase().includes(input.division.trim().toLowerCase())) {
        return AppResponse.notFound('Event');
      }

      // ===== Set Event default value ====
      // Prepare defaults based on the event
      const matchObj: Match = {
        ...input,
        completed: false,
        nets: [],
        rounds: [],
        numberOfNets: input.numberOfNets ?? eventExist.nets,
        numberOfRounds: input.numberOfRounds ?? eventExist.rounds,
        netVariance: input.netVariance ?? eventExist.netVariance,
        homeTeam: input.homeTeam ?? eventExist.homeTeam,
        autoAssign: input.autoAssign ?? eventExist.autoAssign,
        autoAssignLogic: input.autoAssignLogic ?? eventExist.autoAssignLogic,
        rosterLock: input.rosterLock ?? eventExist.rosterLock,
        timeout: input.timeout ?? eventExist.timeout,
        description: input.description ?? eventExist.description,
        location: input.location ?? eventExist.location,
        fwango: input.fwango ?? eventExist.fwango,
        extendedOvertime: false,
      };

      // Create a new room
      const newRoom = await this.roomService.create({ teamA: input.teamA, teamB: input.teamB });
      matchObj.room = newRoom._id;

      // Create the match
      const newMatch = await this.matchService.create(matchObj);

      // ===== Create new ranking for team A and team B =====
      const [teamARanking, teamBRanking] = await Promise.all([
        this.playerRankingService.findOne({
          team: input.teamA,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
        this.playerRankingService.findOne({
          team: input.teamB,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
      ]);
      if (!teamARanking || !teamBRanking) return AppResponse.notFound('Player Ranking');

      const [teamAItems, teamBItems] = await Promise.all([
        this.playerRankingService.findItems({ playerRanking: teamARanking._id }),
        this.playerRankingService.findItems({ playerRanking: teamBRanking._id }),
      ]);

      // Create rounds and nets
      const teamARankings = [],
        teamBRankings = [];

      for (let i = 0; i < teamAItems.length; i += 1) {
        teamARankings.push({ player: teamAItems[i].player, rank: teamAItems[i].rank });
      }

      for (let i = 0; i < teamBItems.length; i += 1) {
        teamBRankings.push({ player: teamBItems[i].player, rank: teamBItems[i].rank });
      }

      const [newTeamARanking, newTeamBRanking] = await Promise.all([
        this.playerRankingService.create({
          rankings: teamARankings,
          rankLock: false,
          team: input.teamA,
          match: newMatch._id,
        }),
        this.playerRankingService.create({
          rankings: teamBRankings,
          rankLock: false,
          team: input.teamB,
          match: newMatch._id,
        }),
      ]);

      await Promise.all([
        this.teamService.updateOne({ _id: input.teamA }, { $addToSet: { playerRankings: newTeamARanking._id } }),
        this.teamService.updateOne({ _id: input.teamB }, { $addToSet: { playerRankings: newTeamBRanking._id } }),
        // Match update
        this.matchService.updateOne(
          { _id: newMatch._id },
          { teamARanking: newTeamARanking._id, teamBRanking: newTeamBRanking._id },
        ),
      ]);

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
          completed: false,
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
        createPromises.push(this.roundService.updateOne({ _id: round._id }, { nets: netIdsOfRound }));
      }
      createPromises.push(
        this.teamService.updateMany(
          { _id: { $in: [input.teamA, input.teamB] } },
          { $addToSet: { matches: newMatch._id } },
        ),
      );

      createPromises.push(this.roomService.updateOne({ _id: newRoom._id }, { match: newMatch._id }));
      createPromises.push(this.eventService.updateOne({ _id: input.event }, { $addToSet: { matches: newMatch._id } }));
      createPromises.push(this.matchService.updateOne({ _id: newMatch._id }, { nets: netIds, rounds: roundIds }));

      await Promise.all(createPromises);
      await this.eventService.findOne({ _id: input.event });

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
      const updatedMatch = await this.matchService.updateOne({ _id: matchId }, input);
      return {
        data: updatedMatch ?? null,
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
  @Mutation((_returns) => GetMatchResponse)
  async deleteMatch(@Args('matchId') matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);
      if (!matchExist) return AppResponse.notFound('Match');

      await this.deleteSingle(matchExist);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetMatchResponse)
  async deleteMatches(@Args('matchIds', { type: () => [String] }) matchIds: string[]) {
    try {
      const deletePromises = [];
      for (let i = 0; i < matchIds.length; i += 1) {
        try {
          const matchExist = await this.matchService.findById(matchIds[i]);
          if (matchExist) {
            deletePromises.push(this.deleteSingle(matchExist));
          }
        } catch (dltErr) {
          console.log(dltErr);
        }
      }

      await Promise.all(deletePromises);

      return {
        data: null,
        code: HttpStatus.NO_CONTENT,
        message: 'Matches Deleted successfully!',
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => GetMatchesResponse)
  async getMatches(@Args('filter', { nullable: true }) filter?: FilterQueryInput) {
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

  @Query((_returns) => GetEventWithMatchesResponse)
  async getEventWithMatches(@Args('eventId', { nullable: false }) eventId: string) {
    try {
      // Assuming matchService is injected in your class
      const [event, matches, teams, ldo, groups] = await Promise.all([
        this.eventService.findById(eventId),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.groupService.find({ event: eventId }),
      ]);

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

  @Query((returns) => GetMatchResponse)
  async getMatch(@Args('matchId') matchId: string) {
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
      return this.netService.find({ match: match._id.toString() });
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
  async group(@Parent() match: Match) {
    try {
      if (!match.group) return null;
      return this.groupService.findById(match.group?.toString());
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

  @ResolveField(() => PlayerRanking)
  async teamARanking(@Parent() match: Match): Promise<PlayerRanking> {
    return this.getTeamRanking(match, match.teamA.toString(), match.teamARanking.toString(), 'teamARanking');
  }

  @ResolveField(() => PlayerRanking)
  async teamBRanking(@Parent() match: Match): Promise<PlayerRanking> {
    return this.getTeamRanking(match, match.teamB.toString(), match.teamBRanking.toString(), 'teamBRanking');
  }
}
