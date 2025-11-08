import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from '../match.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { Match } from '../match.schema';
import { RoomService } from 'src/room/room.service';
import { RedisService } from 'src/redis/redis.service';
import { netKey, singlePlayKey } from 'src/util/helper';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { PlayerService } from 'src/player/player.service';
import { ServerReceiverOnNet } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import { AccessCodeInput, CreateMatchInput, UpdateMatchInput } from './match.input';
import { GetMatchResponse } from './match.response';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { EActionProcess, ETeam, Round } from 'src/round/round.schema';
import { ETieBreaker } from 'src/net/net.schema';

@Injectable()
export class MatchMutations {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private redisService: RedisService,
    private matchService: MatchService,
    private roundService: RoundService,
    private netService: NetService,
    private roomService: RoomService,
    private playerStatsService: PlayerStatsService,
    private playerService: PlayerService,
    private serverReceiverOnNetService: ServerReceiverOnNetService,
    private playerRankingService: PlayerRankingService,
  ) {}

  async deleteSingle(matchExist: Match) {
    try {
      const updatePromises: Promise<any>[] = [];

      // ✅ Delete all rounds and nets in one go
      const roundIds = matchExist.rounds.map(String);
      const netIds = matchExist.nets.map(String);

      // ✅ Fetch related event, room, and all nets in one round
      const [roomExist, nets] = await Promise.all([
        this.roomService.findOne({ match: matchExist._id }),
        this.netService.find({ match: matchExist._id }), // batch fetch
      ]);

      if (roundIds.length) {
        updatePromises.push(this.roundService.deleteMany({ _id: { $in: roundIds } }));
      }
      if (netIds.length) {
        updatePromises.push(this.netService.deleteMany({ _id: { $in: netIds } }));
      }

      // ✅ Update teams (parallel)
      updatePromises.push(
        this.teamService.updateOne({ _id: matchExist.teamA }, { $pull: { matches: matchExist._id } }),
        this.teamService.updateOne({ _id: matchExist.teamB }, { $pull: { matches: matchExist._id } }),
      );

      // ✅ Remove room + match
      updatePromises.push(
        this.roomService.deleteOne({ _id: matchExist.room }),
        this.matchService.deleteOne({ _id: matchExist._id }),
      );

      // ✅ Collect all playerIds from nets in one pass
      const playerIds = new Set<string>();
      const redisDeletePromises: Promise<any>[] = [];

      for (const net of nets) {
        [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB]
          .filter(Boolean)
          .forEach((p) => playerIds.add(String(p)));

        // delete cache for all players of this net
        const netPlayerIds = [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].filter(Boolean);
        redisDeletePromises.push(
          ...netPlayerIds.map((player) => this.redisService.delete(netKey(String(player), String(net._id)))),
        );
      }

      // ✅ Player stats cleanup (batch)
      const playerStatsOfMatch = await this.playerStatsService.find({ match: matchExist._id });
      if (playerStatsOfMatch.length) {
        updatePromises.push(this.playerStatsService.deleteMany({ match: matchExist._id }));
        updatePromises.push(
          this.playerService.updateMany(
            { _id: { $in: playerStatsOfMatch.map((ps) => ps.player) } },
            { $pullAll: { playerstats: playerStatsOfMatch.map((p) => p._id) } },
          ),
        );
      }

      // ✅ Delete all server receiver + single play caches in parallel
      const srCaches = await Promise.all(
        netIds.map((netId) => this.redisService.get(netKey(String(netId), String(roomExist?._id || '')))),
      );

      for (const sr of srCaches.filter(Boolean) as ServerReceiverOnNet[]) {
        const plays = Array.from({ length: sr.mutate || 20 }, (_, i) => i + 1);
        redisDeletePromises.push(
          ...plays.map((p) => this.redisService.delete(singlePlayKey(String(sr.net), String(matchExist.room), p))),
        );
      }

      redisDeletePromises.push(
        ...netIds.map((netId) => this.redisService.delete(netKey(String(netId), roomExist?._id || ''))),
      );

      // ✅ Delete serverReceiverOnNet + detach from players
      const serverReceiverNets = await this.serverReceiverOnNetService.find({ net: { $in: netIds } });
      if (serverReceiverNets.length) {
        const srIds = serverReceiverNets.map((sr) => sr._id);
        updatePromises.push(this.serverReceiverOnNetService.deleteManySinglePlay({ match: matchExist._id }));
        updatePromises.push(
          this.playerService.updateMany({ _id: { $in: [...playerIds] } }, { $pullAll: { serverReceiverOnNet: srIds } }),
        );
      }

      // ✅ Run all updates and deletes in parallel
      await Promise.all([...updatePromises, ...redisDeletePromises]);
    } catch (err) {
      console.error('Error deleting match:', err);
    }
  }

  async createMatch(input: CreateMatchInput): Promise<GetMatchResponse> {
    try {
      const eventExist = await this.eventService.findById(input.event.toString());
      if (!eventExist) return AppResponse.notFound('Event');

      const netIds = [];
      const roundIds = [];
      const playerIds = [];

      const createPromises = [];

      // if (!input.division || !eventExist.divisions.toLowerCase().includes(input.division.trim().toLowerCase())) {
      //   return AppResponse.notFound('Event');
      // }

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

  async updateMatch(input: UpdateMatchInput, matchId: string) {
    try {
      const matchExist = await this.matchService.findOne({ _id: matchId });
      if (!matchExist) return AppResponse.notFound('Match');

      const currRoundId = input?.currRound;
      delete input?.currRound;

      // Update incompleted rounds → completed
      if (!matchExist.completed && input.completed) {
        const [roundListDocs, allNetsDocs] = await Promise.all([
          this.roundService.find({ match: matchId }),
          this.netService.find({ match: matchId }),
        ]);

        // ⚡ Build a fast lookup for nets by roundId to avoid repeated filtering (O(n))
        const netsByRound = new Map<string, any[]>();
        for (const net of allNetsDocs) {
          const key = String(net.round);
          if (!netsByRound.has(key)) netsByRound.set(key, []);
          netsByRound.get(key)!.push(net);
        }

        // Sort rounds once
        const sortedRounds = roundListDocs.sort((a, b) => a.num - b.num);

        // Separate completed vs incomplete rounds
        const completedRounds: any[] = [];
        const incompleteRounds: any[] = [];
        for (const round of sortedRounds) {
          if (round.completed) completedRounds.push(round);
          else incompleteRounds.push(round);
        }

        // Calculate team A/B scores only once (O(n))
        let teamAScore = 0,
          teamBScore = 0;
        for (const round of completedRounds) {
          const nets = netsByRound.get(String(round._id)) || [];
          for (const net of nets) {
            if (net?.teamAScore == null || net?.teamBScore == null) continue;
            if (net.teamAScore > net.teamBScore) teamAScore += net.points;
            else if (net.teamBScore > net.teamAScore) teamBScore += 1;
          }
        }

        // Decide automatic points
        const WIN_POINTS = 9,
          LOSE_POINTS = 1;
        const netTeamAScore = teamAScore > teamBScore ? WIN_POINTS : LOSE_POINTS;
        const netTeamBScore = teamAScore < teamBScore ? WIN_POINTS : LOSE_POINTS;

        // Prepare all update promises (O(n))
        const roundUpdatePromises: Promise<any>[] = [];
        for (const inRound of incompleteRounds) {
          const nets = netsByRound.get(String(inRound._id)) || [];
          const roundTeamAScore = netTeamAScore * nets.length;
          const roundTeamBScore = netTeamBScore * nets.length;

          // Bulk update all nets in one query instead of looping
          if (nets.length > 0) {
            roundUpdatePromises.push(
              this.netService.updateMany(
                { round: inRound._id },
                { $set: { teamAScore: netTeamAScore, teamBScore: netTeamBScore } },
              ),
            );
          }

          // Update the round
          roundUpdatePromises.push(
            this.roundService.updateOne(
              { _id: inRound._id },
              {
                $set: {
                  teamAScore: roundTeamAScore,
                  teamBScore: roundTeamBScore,
                  completed: true,
                  teamAProcess: EActionProcess.LINEUP,
                  teamBProcess: EActionProcess.LINEUP,
                },
              },
            ),
          );
        }

        await Promise.all(roundUpdatePromises);
      }

      // Revert completed → incompleted
      else if (matchExist.completed && !input.completed) {
        const [roundListDocs, allNetsDocs] = await Promise.all([
          this.roundService.find({ match: matchId }),
          this.netService.find({ match: matchId }),
        ]);

        const currRound = roundListDocs.find((r) => String(r._id) === currRoundId);
        if (!currRound) return AppResponse.notFound('Current round');

        // Fast grouping for nets
        const netsByRound = new Map<string, any[]>();
        for (const net of allNetsDocs) {
          const key = String(net.round);
          if (!netsByRound.has(key)) netsByRound.set(key, []);
          netsByRound.get(key)!.push(net);
        }

        const revertPromises: Promise<any>[] = [];
        for (const round of roundListDocs) {
          if (currRound.num >= round.num) continue;

          // Bulk reset all nets for this round
          revertPromises.push(
            this.netService.updateMany(
              { round: round._id },
              {
                $set: {
                  teamAScore: null,
                  teamBScore: null,
                  teamAPlayerA: null,
                  teamAPlayerB: null,
                  teamBPlayerA: null,
                  teamBPlayerB: null,
                },
              },
            ),
          );

          // Reset the round
          revertPromises.push(
            this.roundService.updateOne(
              { _id: round._id },
              { $set: { teamAScore: null, teamBScore: null, completed: false, teamAProcess: EActionProcess.CHECKIN, teamBProcess: EActionProcess.CHECKIN } },
            ),
          );
        }

        await Promise.all(revertPromises);
      }

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

  async deleteMatch(matchId: string) {
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

  async deleteMatches(matchIds: string[]) {
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
}
