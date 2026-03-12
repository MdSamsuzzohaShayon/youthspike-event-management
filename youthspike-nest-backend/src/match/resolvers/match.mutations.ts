import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from '../match.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { Match } from '../match.schema';
import { RoomService } from 'src/room/room.service';
import { RedisService } from 'src/redis/redis.service';
import { netKey, singlePlayKey } from 'src/utils/helper';
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
import { PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';

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
            { _id: { $in: playerStatsOfMatch.map((ps) => String(ps.player)) } },
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
      /**
       * ---------------------------------------------------------
       * 1. Validate Event
       * ---------------------------------------------------------
       */
      const event = await this.eventService.findById(String(input.event));
      if (!event) {
        return AppResponse.notFound('Event');
      }
  
      /**
       * ---------------------------------------------------------
       * 2. Prepare Match Defaults From Event
       * ---------------------------------------------------------
       */
      const numberOfRounds = input.numberOfRounds ?? event.rounds;
      const numberOfNets = input.numberOfNets ?? event.nets;
  
      const matchData: Match = {
        ...input,
        completed: false,
        nets: [],
        rounds: [],
        numberOfNets,
        numberOfRounds,
        netVariance: input.netVariance ?? event.netVariance,
        homeTeam: input.homeTeam ?? event.homeTeam,
        autoAssign: input.autoAssign ?? event.autoAssign,
        autoAssignLogic: input.autoAssignLogic ?? event.autoAssignLogic,
        rosterLock: input.rosterLock ?? event.rosterLock,
        timeout: input.timeout ?? event.timeout,
        description: input.description ?? event.description,
        location: input.location ?? event.location,
        accessCode: input.accessCode ?? event.accessCode,
        fwango: input.fwango ?? event.fwango,
        streamUrl: input.streamUrl ?? null,
        teamAP: input.teamAP ?? 0,
        teamBP: input.teamBP ?? 0,
        extendedOvertime: false,
      };
  
      /**
       * ---------------------------------------------------------
       * 3. Create Room
       * ---------------------------------------------------------
       */
      const room = await this.roomService.create({
        teamA: input.teamA,
        teamB: input.teamB,
      });
  
      matchData.room = room._id;
  
      /**
       * ---------------------------------------------------------
       * 4. Create Match
       * ---------------------------------------------------------
       */
      const match = await this.matchService.create(matchData);
  
      /**
       * ---------------------------------------------------------
       * 5. Fetch Team Rankings
       * ---------------------------------------------------------
       */
      const rankingQuery = {
        $or: [{ match: { $exists: false } }, { match: null }],
      };
  
      const [teamARanking, teamBRanking] = await Promise.all([
        this.playerRankingService.findOne({ team: input.teamA, ...rankingQuery }),
        this.playerRankingService.findOne({ team: input.teamB, ...rankingQuery }),
      ]);
  
      if (!teamARanking || !teamBRanking) {
        return AppResponse.notFound('Player Ranking');
      }
  
      /**
       * ---------------------------------------------------------
       * 6. Fetch Ranking Items
       * ---------------------------------------------------------
       */
      const [teamARankingItems, teamBRankingItems] = await Promise.all([
        this.playerRankingService.findItems({ playerRanking: teamARanking._id }),
        this.playerRankingService.findItems({ playerRanking: teamBRanking._id }),
      ]);
  
      /**
       * ---------------------------------------------------------
       * 7. Clone Rankings For This Match
       * ---------------------------------------------------------
       */
      const teamARankings = teamARankingItems.map((item) => ({
        player: item.player,
        rank: item.rank,
      }));
  
      const teamBRankings = teamBRankingItems.map((item) => ({
        player: item.player,
        rank: item.rank,
      }));
  
      const [newTeamARanking, newTeamBRanking] = await Promise.all([
        this.playerRankingService.create({
          rankings: teamARankings as PlayerRankingItem[],
          rankLock: false,
          team: input.teamA,
          match: match._id,
        }),
        this.playerRankingService.create({
          rankings: teamBRankings as PlayerRankingItem[],
          rankLock: false,
          team: input.teamB,
          match: match._id,
        }),
      ]);
  
      /**
       * ---------------------------------------------------------
       * 8. Update Match + Teams With Ranking IDs
       * ---------------------------------------------------------
       */
      await Promise.all([
        this.teamService.updateOne(
          { _id: input.teamA },
          { $addToSet: { playerRankings: newTeamARanking._id } },
        ),
        this.teamService.updateOne(
          { _id: input.teamB },
          { $addToSet: { playerRankings: newTeamBRanking._id } },
        ),
        this.matchService.updateOne(
          { _id: match._id },
          {
            teamARanking: newTeamARanking._id,
            teamBRanking: newTeamBRanking._id,
          },
        ),
      ]);
  
      /**
       * ---------------------------------------------------------
       * 9. Create Rounds + Nets
       * ---------------------------------------------------------
       */
      const roundIds: string[] = [];
      const netIds: string[] = [];
      const updatePromises: Promise<any>[] = [];
  
      let firstPlacing: ETeam = ETeam.teamA;
  
      for (let roundIndex = 0; roundIndex < numberOfRounds; roundIndex++) {
        const roundData = {
          match: match._id,
          num: roundIndex + 1,
          nets: [],
          players: [],
          teamAProcess:
            roundIndex === 0
              ? EActionProcess.INITIATE
              : EActionProcess.CHECKIN,
          teamBProcess:
            roundIndex === 0
              ? EActionProcess.INITIATE
              : EActionProcess.CHECKIN,
          subs: [],
          firstPlacing,
          completed: false,
        };
  
        const round = await this.roundService.create(roundData);
        roundIds.push(round._id);
  
        firstPlacing =
          firstPlacing === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
  
        /**
         * Create nets for the round
         */
        const netsForRound = Array.from({ length: numberOfNets }).map(
          (_, netIndex) => ({
            match: match._id,
            round: round._id,
            num: netIndex + 1,
            points: 1,
            netType:
              numberOfRounds === roundIndex + 1
                ? ETieBreaker.FINAL_ROUND_NET
                : ETieBreaker.PREV_NET,
            teamAScore: null,
            teamBScore: null,
            pairRange: 0,
          }),
        );
  
        const createdNets = await this.netService.createMany(netsForRound);
  
        const roundNetIds = createdNets.map((net) => net._id);
        netIds.push(...roundNetIds);
  
        updatePromises.push(
          this.roundService.updateOne(
            { _id: round._id },
            { nets: roundNetIds },
          ),
        );
      }
  
      /**
       * ---------------------------------------------------------
       * 10. Final Updates
       * ---------------------------------------------------------
       */
      updatePromises.push(
        this.teamService.updateMany(
          { _id: { $in: [input.teamA, input.teamB] } },
          { $addToSet: { matches: match._id } },
        ),
      );
  
      updatePromises.push(
        this.roomService.updateOne(
          { _id: room._id },
          { match: match._id },
        ),
      );
  
      updatePromises.push(
        this.eventService.updateOne(
          { _id: input.event },
          { $addToSet: { matches: match._id } },
        ),
      );
  
      updatePromises.push(
        this.matchService.updateOne(
          { _id: match._id },
          { nets: netIds, rounds: roundIds },
        ),
      );
  
      await Promise.all(updatePromises);
  
      /**
       * ---------------------------------------------------------
       * 11. Return Response
       * ---------------------------------------------------------
       */
      return {
        data: match,
        code: HttpStatus.CREATED,
        success: true,
        message: 'Match Created successfully!',
      };
  
    } catch (error) {
      return AppResponse.handleError(error);
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

        // const currRound = roundListDocs.find((r) => String(r._id) === currRoundId);
        // if (!currRound) return AppResponse.notFound('Current round');

        // Find a round that has lowest round number and all nets of that round is incomplete
        const incompleteRoundIds = new Set<string>();

        // Fast grouping for nets
        const netsByRound = new Map<string, any[]>();
        for (const net of allNetsDocs) {
          const key = String(net.round);
          if (!netsByRound.has(key)) netsByRound.set(key, []);
          netsByRound.get(key)!.push(net);

          // Check net is filled with players or not
          if (!net?.teamAPlayerA || !net?.teamAPlayerB || !net?.teamBPlayerA || !net?.teamBPlayerB) {
            incompleteRoundIds.add(String(net.round));
          }
        }

        const revertPromises: Promise<any>[] = [];
        for (const round of roundListDocs) {
          if (!incompleteRoundIds.has(String(round._id))) continue;

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
              {
                $set: {
                  teamAScore: null,
                  teamBScore: null,
                  completed: false,
                  teamAProcess: EActionProcess.CHECKIN,
                  teamBProcess: EActionProcess.CHECKIN,
                },
              },
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
