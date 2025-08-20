import { HttpStatus, Injectable } from '@nestjs/common';
import { AccessCodeInput, CreateMatchInput, UpdateMatchInput } from './match.input';
import { GetMatchResponse } from './match.response';
import { MatchService } from './match.service';
import { TeamService } from 'src/team/team.service';
import { EventService } from 'src/event/event.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { RoomService } from 'src/room/room.service';
import { PlayerService } from 'src/player/player.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { MatchHelpers } from './match.helpers';
import { AppResponse } from 'src/shared/response';
import { Match } from './match.schema';
import { EActionProcess, ETeam } from 'src/round/round.schema';
import { ETieBreaker } from 'src/net/net.schema';

@Injectable()
export class MatchMutations {
  constructor(
    private readonly matchService: MatchService,
    private readonly teamService: TeamService,
    private readonly eventService: EventService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly roomService: RoomService,
    private readonly playerService: PlayerService,
    private readonly playerRankingService: PlayerRankingService,
    private readonly helpers: MatchHelpers,
  ) {}

  // ===== Mutations Functions =====
  //   @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles(UserRole.admin, UserRole.director)
  //   @Mutation((returns) => GetMatchResponse)
  async createMatch(input: CreateMatchInput): Promise<GetMatchResponse> {
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
        accessCode: input.accessCode ?? eventExist.accessCode,
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

//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.admin, UserRole.director)
//   @Mutation((returns) => GetMatchResponse)
  async updateMatch( input: UpdateMatchInput, matchId: string): Promise<GetMatchResponse> {
    try {
      await this.matchService.updateOne({ _id: matchId }, input);
      const match = await this.matchService.findById(matchId);
      if (!match) return AppResponse.notFound('Match');
      return {
        data: match,
        message: 'Match Updated successfully!',
        code: HttpStatus.ACCEPTED,
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.admin, UserRole.director)
//   @Mutation((_returns) => GetMatchResponse)
  async deleteMatch(matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);
      if (!matchExist) return AppResponse.notFound('Match');

      await this.helpers.deleteSingle(matchExist);
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

//   @Mutation((_returns) => GetAccessCodeResponse)
  async accessCodeValidation(input: AccessCodeInput) {
    try {
      // Get user detail
      // Match with
      const matchExist = await this.matchService.findOne({ _id: input.matchId, accessCode: input.accessCode });
      if (!matchExist) return AppResponse.notFound('Match');

      // Response with access code and role
      return {
        data: { accessCode: input.accessCode, match: input.matchId },
        code: HttpStatus.OK,
        message: 'Match Deleted successfully!',
        success: true,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.admin, UserRole.director)
//   @Mutation((_returns) => GetMatchResponse)
  async deleteMatches(matchIds: string[]) {
    try {
      const deletePromises = [];
      for (let i = 0; i < matchIds.length; i += 1) {
        try {
          const matchExist = await this.matchService.findById(matchIds[i]);
          if (matchExist) {
            deletePromises.push(this.helpers.deleteSingle(matchExist));
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
}
