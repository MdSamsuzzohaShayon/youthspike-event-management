import { HttpStatus, Injectable } from '@nestjs/common';
import { IPlayerQueries } from './player.types';
import { ConfigService } from '@nestjs/config';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from '../player.service';
import { UserService } from 'src/user/user.service';
import { GroupService } from 'src/group/group.service';
import { tokenToUser } from 'src/util/helper';
import { UserRole } from 'src/user/user.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { AppResponse } from 'src/shared/response';
import { QueryOptions } from 'mongoose';
import { Player } from '../player.schema';
import { GetEventWithPlayersResponse, GetPlayerAndTeamsResponse, PlayerResponse, CustomPlayer } from './player.response';
import { CustomGroup, CustomTeam } from 'src/match/match.response';

@Injectable()
export class PlayerQueries implements IPlayerQueries{
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private userService: UserService,
    private groupService: GroupService,
    private playerRankingService: PlayerRankingService
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
        const teamIds = capPlayer.teams.map((t) => t._id.toString());
        playerRankings = await this.playerRankingService.find({ team: { $in: teamIds } });
        const playerRankingIds = playerRankings.map((pr) => pr._id.toString());
        rankings = await this.playerRankingService.findItems({ playerRanking: { $in: playerRankingIds } });
      }

      // Normalize to Custom* GraphQL output shapes (string IDs for refs)
      const normalizedPlayers: CustomPlayer[] = players.map((p: any) => {
        const obj = typeof p?.toObject === 'function' ? p.toObject() : p;
        return {
          ...obj,
          teams: (obj?.teams || []).map((t: any) => t?.toString?.() || String(t)),
          captainofteams: (obj?.captainofteams || []).map((t: any) => t?.toString?.() || String(t)),
          cocaptainofteams: (obj?.cocaptainofteams || []).map((t: any) => t?.toString?.() || String(t)),
        } as CustomPlayer;
      });

      const normalizedTeams: CustomTeam[] = teams.map((t: any) => {
        const obj = typeof t?.toObject === 'function' ? t.toObject() : t;
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

      const normalizedGroups: CustomGroup[] = groups.map((g: any) => {
        const obj = typeof g?.toObject === 'function' ? g.toObject() : g;
        return {
          ...obj,
          teams: (obj?.teams || []).map((tm: any) => tm?.toString?.() || String(tm)),
        } as CustomGroup;
      });

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get details of Players, teams, groups',
        data: { event, players: normalizedPlayers, teams: normalizedTeams, groups: normalizedGroups, playerRankings, rankings },
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

  async getPlayerAndTeams( playerId: string, eventId: string): Promise<GetPlayerAndTeamsResponse> {
    try {
      const [player, teams] = await Promise.all([
        this.playerService.findById(playerId.toString()),
        this.teamService.find({ event: eventId }),
      ]);
      const normalizedPlayer: CustomPlayer = (() => {
        const obj: any = typeof (player as any)?.toObject === 'function' ? (player as any).toObject() : player;
        return {
          ...obj,
          teams: (obj?.teams || []).map((t: any) => t?.toString?.() || String(t)),
          captainofteams: (obj?.captainofteams || []).map((t: any) => t?.toString?.() || String(t)),
          cocaptainofteams: (obj?.cocaptainofteams || []).map((t: any) => t?.toString?.() || String(t)),
        } as CustomPlayer;
      })();

      const normalizedTeams: CustomTeam[] = teams.map((t: any) => {
        const obj = typeof t?.toObject === 'function' ? t.toObject() : t;
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
