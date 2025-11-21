import { HttpStatus } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { PlayerStats } from './player-stats.schema';
import { PlayerStatsService } from './player-stats.service';
import {
  CustomPlayerStats,
  PlayersStatsResponse,
  PlayerStatsResponse,
  PlayerWithStatsResponse,
} from './player-stats.response';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { NetService } from 'src/net/net.service';
import { playerKey } from 'src/util/helper';
import { RedisService } from 'src/redis/redis.service';
import { EventService } from 'src/event/event.service';
import { Team } from 'src/team/team.schema';
import { RoundService } from 'src/round/round.service';
import { Net } from 'src/net/net.schema';
import { Round } from 'src/round/round.schema';
import { Match } from 'src/match/match.schema';
import { Player } from 'src/player/player.schema';
import { GroupService } from 'src/group/group.service';

@Resolver((_of) => PlayerStats)
export class PlayerStatsResolver {
  constructor(
    private readonly playerService: PlayerService,
    private readonly teamService: TeamService,
    private readonly matchService: MatchService,
    private readonly netService: NetService,
    private readonly playerStatsService: PlayerStatsService,
    private readonly redisService: RedisService,
    private readonly eventService: EventService,
    private readonly roundService: RoundService,
    private readonly groupService: GroupService,
  ) {}

  @Query((_returns) => PlayerStatsResponse)
  async getPlayerStats(@Args('playerId', { type: () => [String] }) playerId: string) {
    try {
      const playerStatsExist = await this.playerStatsService.findById(playerId.toString());
      if (!playerStatsExist) return AppResponse.notFound('PlayerStats');
      return {
        code: HttpStatus.OK,
        success: true,
        data: playerStatsExist,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayersStatsResponse)
  async getPlayersStats() {
    try {
      const playersStats = await this.playerStatsService.find({});
      return {
        code: HttpStatus.OK,
        success: true,
        data: playersStats,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayerWithStatsResponse)
  async getPlayerWithStats(@Args('playerId') playerId: string) {
    try {
      // 1️⃣ Fetch player
      const player = await this.playerService.findById(playerId);
      if (!player) return AppResponse.notFound('Player');

      // 2️⃣ Declare variables
      let team: Team | null = null;
      let matches: Match[] = [];
      let nets: Net[] = [];
      let rounds: Round[] = [];
      let playerstats: CustomPlayerStats[] = [];
      let players: Player[] = [];
      let oponents: Team[] = [];

      const oponentIds = new Set<string>();
      const playerIds = new Set<string>();

      // 3️⃣ Fetch event + pro stats concurrently
      const eventExist = await this.eventService.findOne({ _id: { $in: player.events } });
      if (!eventExist) return AppResponse.notFound('Event');

      const [multiplayer, weight, groups] = await Promise.all([
        this.playerStatsService.proStatFindOne({ _id: eventExist.multiplayer }),
        this.playerStatsService.proStatFindOne({ _id: eventExist.weight }),
        this.groupService.find({ event: eventExist._id }),
      ]);

      const teams = await this.teamService.find({ $or: [{ players: playerId }, { moved: playerId }] });
      // 4️⃣ If player has teams → fetch team, matches, nets, rounds
      if (teams.length > 0) {
        const teamIds = new Set<string>(teams.map((t) => t._id));
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          teamIds.add(t._id);

          for (let j = 0; j < t.players.length; j++) {
            const p = t.players[j];
            if (String(p) === playerId) {
              team = t;
            }
          }
        }
        // find all teams a player ever played in
        // 4.1️⃣ Fetch matches once
        matches = await this.matchService.find(
          {
            $or: [{ teamA: { $in: [...teamIds] } }, { teamB: { $in: [...teamIds] } }],
          },
          10000,
          0,
        );

        if (matches.length > 0) {
          // 4.2️⃣ Collect matchIds and opponent IDs efficiently
          const matchIds = matches.map((m) => {
            if (!teamIds.has(String(m.teamA))) oponentIds.add(String(m.teamA));
            if (!teamIds.has(String(m.teamB))) oponentIds.add(String(m.teamB));
            return m?._id?.toString();
          });

          // 4.3️⃣ Fetch nets & rounds in parallel
          [nets, rounds] = await Promise.all([
            this.netService.find({
              match: { $in: matchIds },
              $or: [
                { teamAPlayerA: playerId },
                { teamAPlayerB: playerId },
                { teamBPlayerA: playerId },
                { teamBPlayerB: playerId },
              ],
            }),
            this.roundService.find({ match: { $in: matchIds } }),
          ]);

          // 4.4️⃣ Process nets once
          const redisKeys: string[] = [];
          for (const n of nets) {
            redisKeys.push(playerKey(playerId, n._id));
            [n.teamAPlayerA, n.teamAPlayerB, n.teamBPlayerA, n.teamBPlayerB]
              .filter(Boolean)
              .forEach((pid) => playerIds.add(pid as string));
          }

          // 4.5️⃣ Fetch Redis + DB stats concurrently
          const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));
          const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean);

          const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));
          const dbQuery =
            redisNetIds.size > 0 ? { player: playerId, net: { $nin: Array.from(redisNetIds) } } : { player: playerId };

          // Use separate awaits (readability + simplicity)
          const playerstatsDB = await this.playerStatsService.find(dbQuery);
          players = await this.playerService.find({ _id: { $in: [...playerIds] } });

          // 4.6️⃣ Merge DB + Redis stats
          const playerstatsDBPlain = playerstatsDB.map((ps) => ({
            ...ps,
            net: String(ps.net),
            player: String(ps.player),
            match: String(ps.match),
          }));

          playerstats = [...playerstatsRedis, ...playerstatsDBPlain];

          // 4.7️⃣ If no stats, create empty placeholders
          if (playerstats.length === 0) {
            playerstats = nets.map(
              (net) =>
                ({
                  serveOpportunity: 0,
                  serveAce: 0,
                  serveCompletionCount: 0,
                  servingAceNoTouch: 0,
                  receiverOpportunity: 0,
                  receivedCount: 0,
                  noTouchAcedCount: 0,
                  settingOpportunity: 0,
                  cleanSets: 0,
                  hittingOpportunity: 0,
                  cleanHits: 0,
                  defensiveOpportunity: 0,
                  defensiveConversion: 0,
                  break: 0,
                  broken: 0,
                  matchPlayed: 0,
                  net: net._id.toString(),
                  player: playerId,
                  match: net.match.toString(),
                } as CustomPlayerStats),
            );
          }
        }
      }

      // 5️⃣ Fetch opponents if any
      if (oponentIds.size > 0) {
        oponents = await this.teamService.find({ _id: { $in: [...oponentIds] } });
      }

      // ✅ Final structured response
      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          player,
          team,
          playerstats,
          matches,
          rounds,
          nets,
          multiplayer,
          weight,
          oponents,
          players,
          groups,
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
