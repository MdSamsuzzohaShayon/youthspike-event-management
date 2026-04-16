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
import { QueryFilter, QueryOptions } from 'mongoose';
import { Player } from '../player.schema';
import {

  GetPlayerAndTeamsResponse,
  PlayerResponse,
  CustomPlayer,
} from './player.response';
import { CustomGroup, CustomTeam } from 'src/match/resolvers/match.response';
import { PlayerSearchFilter } from './player.input';
import { Team } from 'src/team/team.schema';
import { Event } from 'src/event/event.schema';
import { LdoService } from 'src/ldo/ldo.service';

@Injectable()
export class PlayerQueries implements IPlayerQueries {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private userService: UserService,
    private groupService: GroupService,
    private ldoService: LdoService,

  ) { }


  async getPlayers(eventId?: string, limit = 30, offset = 0) {
    try {
      let query: QueryOptions<Player> = {};

      if (eventId) {
        query = { events: { $in: [eventId] } };
      }

      const players = await this.playerService.find(query, limit, offset);

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

  async searchPlayers(context: any, eventId: string, filter: PlayerSearchFilter) {
    try {
      const playerQuery: QueryFilter<Player> = {};
      const teamQuery: QueryFilter<Team> = { events: eventId };

      // Return any one of them between player and event
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);



      // Get user
      const [loggedUser, event, groups] = await Promise.all([
        this.userService.findById(userPayload?._id),
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find({ event: eventId })
      ]);

      if (!event) {
        return AppResponse.notFound("Event");
      }

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
      }
      if (filter?.group) {
        teamQuery.group = filter.group;
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


      let teams = [];
      if (filter?.group) {
        teams = await this.teamService.find(teamQuery);

        const teamIds = new Set<string>();
        if (teams.length > 0) {
          for (let i = 0; i < teams.length; i += 1) {
            teamIds.add(String(teams[i]._id));
          }
        }
        // Get all teams in that group
        playerQuery.teams = { $in: [...teamIds] };
      }

      const players = await this.playerService.find(playerQuery, filter?.limit || 30, filter?.offset || 0);

      if (!filter?.group) {
        const teamIds = new Set<string>();
        for (const player of players) {
          if (player?.teams && player?.teams.length > 0) {
            for (const team of player?.teams) {
              teamIds.add(String(team));
            }
          }

        }
        teams = await this.teamService.find({ _id: [...teamIds] });
      }

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of players!',
        data: { event, groups, players, teams },
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }



  async getPlayerAndTeams(playerId: string, eventIds?: string[]): Promise<GetPlayerAndTeamsResponse> {
    try {
      let events = [], player = null, teams = [];
      if (eventIds && eventIds.length > 0) {
        [events, player, teams] = await Promise.all([
          this.eventService.find({ _id: { $in: eventIds } }),
          this.playerService.findById(playerId.toString()),
          this.teamService.find({ events: { $in: eventIds } }),
        ]);
      } else {
        // Find player first, then find ldo ides, get all events  of that ldo
        player = await this.playerService.findById(playerId.toString());
        if (!player) return AppResponse.notFound("Player");
        const firstEvent = await this.eventService.findOne({ _id: { $in: player.events } });
        if (!firstEvent) return AppResponse.notFound("Event");
        const ldo = await this.ldoService.findOne({ events: firstEvent._id });
        if (!ldo) return AppResponse.notFound("LDO");
        events = await this.eventService.find({ _id: { $in: ldo.events as string[] } });
        teams = await this.teamService.find({ events: { $in: ldo.events } });
      }
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get one player and all teams of an event!',
        data: {
          player: player as CustomPlayer,
          teams: teams as CustomTeam[],
          events: events as Event[]
        },
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
