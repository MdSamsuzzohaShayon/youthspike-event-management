import { HttpStatus, Injectable } from '@nestjs/common';
import { IPlayerQueries } from './player.types';
import { ConfigService } from '@nestjs/config';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from '../player.service';
import { UserService } from 'src/user/user.service';
import { GroupService } from 'src/group/group.service';
import { tokenToUser } from 'src/utils/helper';
import { UserRole } from 'src/user/user.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { AppResponse } from 'src/shared/response';
import { FilterQuery, QueryOptions } from 'mongoose';
import { Player } from '../player.schema';
import {
  GetEventWithPlayersResponse,
  GetPlayerAndTeamsResponse,
  PlayerResponse,
  CustomPlayer,
} from './player.response';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';
import { EGroupType, PlayerSearchFilter } from './player.input';
import { Team } from 'src/team/team.schema';
import { Group } from 'src/group/group.schema';
import { NetService } from 'src/net/net.service';
import getStatsOfPlayers from 'src/utils/getStatsOfPlayers';
import { CustomPlayerStats } from 'src/player-stats/resolvers/player-stats.response';
import { RedisService } from 'src/redis/redis.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { Match } from 'src/match/match.schema';
import { MatchService } from 'src/match/match.service';

@Injectable()
export class PlayerQueries implements IPlayerQueries {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private userService: UserService,
    private groupService: GroupService,
    private netService: NetService,
    private playerRankingService: PlayerRankingService,
    private playerStatsService: PlayerStatsService,
    private redisService: RedisService,
    private matchesService: MatchService,
  ) {}

  async getEventWithPlayers(context: any, eventId: string): Promise<GetEventWithPlayersResponse> {
    try {
      // Get user id
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);

      // Get user
      const loggedUser = userPayload && userPayload?._id ? await this.userService.findById(userPayload._id) : null;

      // Assuming matchService is injected in your class
      const [event, players, teams, groups] = await Promise.all([
        this.eventService.findById(eventId),
        this.playerService.find({ events: { $in: [eventId] } }),
        this.teamService.find({ event: eventId }),
        this.groupService.find({ event: eventId }),
      ]);

      // Get player ranking
      let playerRankings = [],
        rankings = [];
      if (loggedUser?.role === UserRole.captain || loggedUser?.role === UserRole.co_captain) {
        const capPlayer = await this.playerService.findOne({
          $or: [{ captainuser: loggedUser._id }, { cocaptainuser: loggedUser._id }],
        });

        if (capPlayer?.teams?.length) {
          const teamIds = capPlayer.teams.map((t) => t._id.toString());
          playerRankings = await this.playerRankingService.find({ team: { $in: teamIds } });

          const playerRankingIds = playerRankings.map((pr) => pr._id.toString());
          rankings = await this.playerRankingService.findItems({ playerRanking: { $in: playerRankingIds } });
        } else {
          // Optional: log or handle case when capPlayer is null
          console.warn('No captain player found for logged user:', loggedUser._id);
        }
      }

      // Normalize to Custom* GraphQL output shapes (string IDs for refs)
      const normalizedPlayers: CustomPlayer[] = players.map((p: Player) => {
        const obj = { ...p };
        if (!obj?.username) {
          obj.username = this.playerService.playerUsername((obj?.firstName || '') + '2');
          (async () => {
            await this.playerService.updateOne({ _id: obj._id }, { username: obj.username });
          })();
        }
        return {
          ...obj,
          teams: (obj?.teams || []).map((t: any) => t?.toString?.() || String(t)),
          captainofteams: (obj?.captainofteams || []).map((t: any) => t?.toString?.() || String(t)),
          cocaptainofteams: (obj?.cocaptainofteams || []).map((t: any) => t?.toString?.() || String(t)),
        } as CustomPlayer;
      });

      const normalizedTeams: CustomTeam[] = teams.map((t: Team) => {
        const obj = { ...t };
        return {
          ...obj,
          matches: (obj?.matches || []).map((m: any) => m?.toString?.() || String(m)),
          nets: (obj?.nets || []).map((n: any) => n?.toString?.() || String(n)),
          players: (obj?.players || []).map((p: any) => p?.toString?.() || String(p)),
          captain: obj?.captain?.toString?.() || (obj?.captain ? String(obj.captain) : null),
          cocaptain: obj?.cocaptain?.toString?.() || (obj?.cocaptain ? String(obj.cocaptain) : null),
          group: obj?.group?.toString?.() || (obj?.group ? String(obj.group) : null),
        } as CustomTeam;
      });

      const normalizedGroups: CustomGroup[] = groups.map((g: Group) => {
        const obj = { ...g };
        return {
          ...obj,
          teams: (obj?.teams || []).map((tm: any) => tm?.toString?.() || String(tm)),
        } as CustomGroup;
      });

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get details of Players, teams, groups',
        data: {
          event,
          players: normalizedPlayers,
          teams: normalizedTeams,
          groups: normalizedGroups,
          playerRankings,
          rankings,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getPlayers(eventId: string) {
    try {
      let query: QueryOptions<Player> = {};
      if (eventId) query = { events: { $in: [eventId] } };
      const players = await this.playerService.find(query);
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of players!',
        data: players,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async searchPlayers(eventId: string, filter: PlayerSearchFilter) {
    try {
      const playerQuery: FilterQuery<Player> = {};
      const teamQuery: FilterQuery<Team> = { event: eventId };
      const groupQuery: FilterQuery<Group> = { event: eventId };
      const matchQuery: FilterQuery<Match> = { event: eventId };

      // By default select conference

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

      const matchIds = new Set(matches.map((m) => String(m._id)));

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

  async getPlayerAndTeams(playerId: string, eventId: string): Promise<GetPlayerAndTeamsResponse> {
    try {
      const [player, teams] = await Promise.all([
        this.playerService.findById(playerId.toString()),
        this.teamService.find({ event: eventId }),
      ]);
      const normalizedPlayer: CustomPlayer = (() => {
        const obj = { ...player };
        // if(obj?.username){
        //   obj.username = this.playerService.playerUsername((obj?.firstName || "abc") + "4");
        //   (async()=>{
        //     await this.playerService.updateOne({_id: obj._id}, {username: obj.username});
        //   })()
        // }
        return {
          ...obj,
          teams: (obj?.teams || []).map((t: any) => t?.toString?.() || String(t)),
          captainofteams: (obj?.captainofteams || []).map((t: any) => t?.toString?.() || String(t)),
          cocaptainofteams: (obj?.cocaptainofteams || []).map((t: any) => t?.toString?.() || String(t)),
        } as CustomPlayer;
      })();

      const normalizedTeams: CustomTeam[] = teams.map((t: any) => {
        const obj = { ...t };
        return {
          ...obj,
          matches: (obj?.matches || []).map((m: any) => m?.toString?.() || String(m)),
          nets: (obj?.nets || []).map((n: any) => n?.toString?.() || String(n)),
          players: (obj?.players || []).map((p: any) => p?.toString?.() || String(p)),
          captain: obj?.captain?.toString?.() || (obj?.captain ? String(obj.captain) : null),
          cocaptain: obj?.cocaptain?.toString?.() || (obj?.cocaptain ? String(obj.cocaptain) : null),
          group: obj?.group?.toString?.() || (obj?.group ? String(obj.group) : null),
        } as CustomTeam;
      });
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get one player and all teams of an event!',
        data: { player: normalizedPlayer, teams: normalizedTeams },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async getPlayer(playerId: string): Promise<PlayerResponse> {
    try {
      const playerExist = await this.playerService.findById(playerId.toString());
      return {
        code: playerExist ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: playerExist ? true : false,
        data: playerExist,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
