import { HttpStatus, Injectable } from '@nestjs/common';
import { MatchService } from 'src/match/match.service';
import { NetService } from 'src/net/net.service';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { PlayerStatsService } from '../player-stats.service';
import { RedisService } from 'src/redis/redis.service';
import { EventService } from 'src/event/event.service';
import { RoundService } from 'src/round/round.service';
import { GroupService } from 'src/group/group.service';
import { AppResponse } from 'src/shared/response';
import { Team } from 'src/team/team.schema';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Round } from 'src/round/round.schema';
import { CustomPlayerStats, PlayerWithStatsResponse } from './player-stats.response';
import { Player } from 'src/player/player.schema';
import { playerKey, tokenToUser } from 'src/utils/helper';
import { QueryFilter, QueryOptions } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { EGroupType, PlayerSearchFilter } from 'src/player/resolvers/player.input';
import { Group } from 'src/group/group.schema';
import getStatsOfPlayers from 'src/utils/getStatsOfPlayers';
import { PlayerStatsSearchFilter } from './player-stats.input';
import { CustomPlayer } from 'src/player/resolvers/player.response';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';
import { CustomMatch, CustomNet, CustomRound } from 'src/team/resolvers/team.response';
import {CustomEvent} from 'src/event/resolvers/event.response';


@Injectable()
export class PlayerStatsQueries {
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
    private readonly matchesService: MatchService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) { }

  async getPlayerStats(playerId: string) {
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

  async getPlayerWithStats(playerId: string, group?: boolean): Promise<PlayerWithStatsResponse> {
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
      const events = await this.eventService.find({ _id: { $in: player.events.map(e => String(e)) } });
      if (!events) return AppResponse.notFound('Event');

      const multiplayerIds = new Set<string>(),
        weightIds = new Set<string>(),
        eventIds = new Set<string>();
      for (const event of events) {
        if (event?.multiplayer) {
          multiplayerIds.add(String(event.multiplayer));
        }
        if (event?.weight) {
          weightIds.add(String(event.weight));
        }
        eventIds.add(String(event._id));
      }

      const [multiplayers, weights, groups] = await Promise.all([
        this.playerStatsService.proStatFind({ _id: { $in: [...multiplayerIds] } }),
        this.playerStatsService.proStatFind({ _id: { $in: [...weightIds] } }),
        this.groupService.find({ event: { $in: [...eventIds] } }),
      ]);

      const teamQuery: QueryFilter<Team> = { $or: [{ players: playerId }, { moved: playerId }] };
      if (group) {
        teamQuery.group = {
          $exists: true,
          $type: 'string',
          $ne: '',
          $regex: new RegExp(`^${group}$`, 'i'),
        };
      }
      const teams = await this.teamService.find(teamQuery);
      // 4️⃣ If player has teams → fetch team, matches, nets, rounds
      if (teams.length > 0) {
        const teamIds = new Set<string>();
        const groupIds = new Set<string>();
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          teamIds.add(t._id);

          if (group && t.groups) {
            for (const g of t.groups) {
              groupIds.add(String(g));
            }
          }

          for (let j = 0; j < t.players.length; j++) {
            const p = t.players[j];
            if (String(p) === playerId) {
              team = t;
            }
          }
        }
        // find all teams a player ever played in
        // 4.1️⃣ Fetch matches once
        const matchQuery: QueryFilter<Match> = {
          $or: [{ teamA: { $in: [...teamIds] } }, { teamB: { $in: [...teamIds] } }],
          includeStats: true
        };
        if (group) {
          matchQuery.group = { $in: [...groupIds] };
        }
        matches = await this.matchService.find(matchQuery);

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
              .filter(Boolean) // can not be null or false
              .forEach((pid) => playerIds.add(pid as string));
          }

          // 4.5️⃣ Fetch Redis + DB stats concurrently
          const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));
          const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean);

          const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));
          const dbQuery = redisNetIds.size > 0 ? { player: playerId, net: { $nin: Array.from(redisNetIds) } } : { player: playerId };

          // Use separate awaits (readability + simplicity)
          const playerstatsDB = await this.playerStatsService.find(dbQuery);
          players = await this.playerService.find({ _id: { $in: [...playerIds] } });

          // 4.6️⃣ Merge DB + Redis stats
          const playerstatsDBPlain = playerstatsDB.map((ps) => ({
            ...ps,
            net: String(ps.net),
            player: String(ps.player),
            match: String(ps.match),
            event: ps?.event ? String(ps?.event) : null,
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
                event: null,
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
          player: player as CustomPlayer,
          team: team as CustomTeam,
          playerstats,
          matches: matches as CustomMatch[],
          rounds: rounds as CustomRound[],
          nets: nets as CustomNet[],
          multiplayers: multiplayers,
          weights,
          oponents: oponents as CustomTeam[],
          players: players as CustomPlayer[],
          groups: groups as CustomGroup[],
          events: events as CustomEvent[],
          stats: [] // ProStats
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async searchPlayerStats(context: any, eventId: string, filter: PlayerStatsSearchFilter) {
    try {
      const playerQuery: QueryFilter<Player> = {};
      const teamQuery: QueryFilter<Team> = { event: eventId };
      const groupQuery: QueryFilter<Group> = { event: eventId };
      const matchQuery: QueryFilter<Match> = { event: eventId };

      // Return any one of them between player and event
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);

      // Get user
      const loggedUser = await this.userService.findById(userPayload?._id);

      // If logged in as captain or co-captain
      if (loggedUser?.captainplayer || loggedUser?.cocaptainplayer) {
        let teamOfCaptain = null;

        if (loggedUser.captainplayer) {
          teamOfCaptain = await this.teamService.findOne({ captain: loggedUser.captainplayer });
        }
        if (loggedUser.cocaptainplayer) {
          teamOfCaptain = await this.teamService.findOne({ cocaptain: loggedUser.cocaptainplayer });
        }
        if (!teamOfCaptain) {
          return AppResponse.notFound('Team');
        }
        playerQuery.teams = { $in: [teamOfCaptain?._id] };
      }

      if (eventId) {
        playerQuery.events = { $in: [eventId] };
      }
      if (filter?.division) {
        playerQuery.division = { $regex: new RegExp(`${filter.division}`, 'i') };
        teamQuery.division = { $regex: new RegExp(`${filter.division}`, 'i') }; // This will be case insensative
        matchQuery.division = { $regex: new RegExp(`${filter.division}`, 'i') };
      }
      if (filter?.group) {
        teamQuery.group = filter.group;
        matchQuery.group = filter.group;
        // If there is a group then show matches for a player according to group
      }

      if (filter?.search) {
        //Check for multiple words
        const words = filter.search.split(' ');

        if (words.length > 1) {
          playerQuery.firstName = { $regex: new RegExp(words[0].trim(), 'i') };
          playerQuery.lastName = { $regex: new RegExp(words[1].trim(), 'i') };
        } else {
          playerQuery.$or = [
            { firstName: { $regex: new RegExp(filter.search, 'i') } },
            { lastName: { $regex: new RegExp(filter.search, 'i') } },
            { username: { $regex: new RegExp(filter.search, 'i') } },
          ];
        }
      }

      if (filter?.ce === EGroupType.CONFERENCE) {
        // teamQuery.group = { $ne: null };
        matchQuery.group = { $ne: null };
      }

      const [event, groups, teams, matches] = await Promise.all([
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find(groupQuery),
        this.teamService.find(teamQuery),
        this.matchesService.find(matchQuery),
      ]);

      // const matchIds = new Set(matches.map((m) => String(m._id)));
      const matchIds = new Set();
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (!match?.includeStats) continue;
        matchIds.add(String(match._id));
      }

      const teamIds = new Set<string>();
      if (teams.length > 0) {
        for (let i = 0; i < teams.length; i += 1) {
          teamIds.add(String(teams[i]._id));
        }
      }

      if (filter?.group) {
        // Get all teams in that group
        playerQuery.teams = { $in: [...teamIds] };
      }

      const players = await this.playerService.find(playerQuery, filter?.limit || 30, filter?.offset || 0);

      const playerIds = players.map((p) => String(p._id));

      let nets = await this.netService.find({
        $or: [
          { teamAPlayerA: { $in: playerIds } },
          { teamAPlayerB: { $in: playerIds } },
          { teamBPlayerA: { $in: playerIds } },
          { teamBPlayerB: { $in: playerIds } },
        ],
      });

      nets = nets.filter((n) => matchIds.has(String(n.match)));

      const statsOfPlayer: Record<string, CustomPlayerStats[]> = await getStatsOfPlayers(
        players,
        nets,
        this.redisService,
        this.playerStatsService,
        eventId
      );

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of players!',
        data: {
          players,
          groups,
          event,
          teams,
          matches,
          statsOfPlayer: Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
            playerId,
            stats,
          })),
        },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
