import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventService } from '../event.service';
import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { GroupService } from 'src/group/group.service';
import { UserService } from 'src/user/user.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { tokenToUser } from 'src/utils/helper';
import { Event } from '../event.schema';
import {
  GetEventResponse,
  GetEventsResponse, GetEventWithGroupsAndUnassignedPlayersResponse, GetPlayerEventSettingResponse
} from './event.response';
import { IEventQueries } from '../resolvers/event.types';
import { Net } from 'src/net/net.schema';
import { CustomPlayerStats } from 'src/player-stats/resolvers/player-stats.response';
import { CustomTeam } from 'src/team/resolvers/team.response';
import { Group } from 'src/group/group.schema';
import { Player } from 'src/player/player.schema';
import { CustomGroup } from 'src/match/resolvers/match.response';
import { CustomPlayer } from 'src/player/resolvers/player.response';

@Injectable()
export class EventQueries implements IEventQueries {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private playerService: PlayerService,
    private playerStatsService: PlayerStatsService,
    private userService: UserService,
    private groupService: GroupService,
    private sponsorService: SponsorService,
  ) { }

  async getEvents(context: any, directorId?: string): Promise<GetEventsResponse> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);

      // Get logged in user
      const loggedUser = userPayload?._id ? await this.userService.findById(userPayload._id) : null;

      // Determine director ID based on user role
      let newDirectorId = null;
      if (loggedUser) {
        switch (loggedUser.role) {
          case UserRole.director:
            newDirectorId = loggedUser._id;
            break;
          /*
          case UserRole.admin:
          if (!directorId) {
            return AppResponse.handleError({
              success: false,
              message: 'You must select a director in order to get all events!',
            });
          }
          newDirectorId = directorId;
          break;
          */
          default:
            break;
        }
      }

      // Filter events based on director ID
      const filter: QueryFilter<Event> = {};
      if (newDirectorId) {
        const ldoExist = await this.ldoService.findByDirectorId(newDirectorId);
        if (ldoExist) {
          filter.ldo = ldoExist._id;
        }
      }

      const events = await this.eventService.find(filter);
      return {
        code: HttpStatus.OK,
        success: true,
        message: "All events",
        data: events,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }



  async getEventWithGroupsAndUnassignedPlayers(
    context: any,
    ldoId?: string,
  ): Promise<GetEventWithGroupsAndUnassignedPlayersResponse> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
  
      // Decode token
      const userPayload = tokenToUser(context, secret);
  
      if (!userPayload?._id) {
        return AppResponse.unauthorized();
      }
  
      // Only fetch fields we actually need
      const loggedUser = await this.userService.findOne(
        { _id: userPayload._id }
      );
  
      if (!loggedUser) {
        return AppResponse.unauthorized();
      }
  
      let events = [];
  

  
      /**
       * CASE 1:
       * Admin requesting events from specific LDO
       */
      if (ldoId && loggedUser.role === UserRole.admin) {
        const ldo = await this.ldoService.findByDirectorId(ldoId);
  
        if (ldo?.events?.length) {
          events = await this.eventService.find({
            _id: { $in: ldo.events as string[] },
          });
        }
      }
  
      /**
       * CASE 2:
       * Director requesting own events
       */
      else if (loggedUser.role === UserRole.director) {
        const ldo = await this.ldoService.findOne({
          director: loggedUser._id,
        });
  
        if (ldo?.events?.length) {
          events = await this.eventService.find({
            _id: { $in: ldo.events as string[] },
          });
        }
      }
  
      const resolvedEventIds = events.map((event) => event._id);
  
      /**
       * Build queries
       */
      const groupQuery: QueryFilter<Group> = {};
  
      const playerQuery: QueryFilter<Player> = {
        $or: [
          { teams: { $size: 0 } },
          { teams: { $exists: false } },
          { teams: null },
        ],
      };
  
      // Only add event filters when events exist
      if (resolvedEventIds.length > 0) {
        groupQuery.event = {
          $in: resolvedEventIds,
        };
  
        playerQuery.events = {
          $in: resolvedEventIds,
        };
      }
  
      /**
       * Parallel DB queries
       */
      const [groups, players] = await Promise.all([
        this.groupService.find(groupQuery),
        this.playerService.find(playerQuery),
      ]);
  
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'events, players, groups',
        data: {
          events,
          groups: groups as CustomGroup[],
          players: players as CustomPlayer[],
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }



  async getPlayerEventSetting(context: any, eventId: string): Promise<GetPlayerEventSettingResponse> {
    try {
      // Return any one of them between player and event
      const secret = this.configService.get<string>('JWT_SECRET');
      const userPayload = tokenToUser(context, secret);

      // Get user
      const loggedUser = await this.userService.findById(userPayload?._id);

      const teams = await this.teamService.find({ events: eventId });
      if (
        loggedUser?.role === UserRole.captain ||
        loggedUser?.role === UserRole.co_captain ||
        loggedUser?.role === UserRole.player
      ) {
        const playerExist = await this.playerService.findOne({
          $or: [{ _id: loggedUser.captainplayer }, { _id: loggedUser.cocaptainplayer }, { _id: loggedUser.player }],
        });
        if (!playerExist) return AppResponse.notFound('Player');
        return {
          code: HttpStatus.OK,
          success: true,
          message: 'event, teams, ldo, sponsors, multiplayer, weight, stats',
          data: {
            player: {
              ...playerExist,
              teams: playerExist.teams?.map((t) => (typeof t === 'object' ? t._id : t)) || [],
              captainofteams:
                playerExist.captainofteams?.map((t: any) =>
                  typeof t === 'object' ? t._id : t?.toString?.() || String(t),
                ) || [],
              cocaptainofteams:
                playerExist.cocaptainofteams?.map((t: any) =>
                  typeof t === 'object' ? t._id : t?.toString?.() || String(t),
                ) || [],
            },
            teams: teams as CustomTeam[],
          },
        };
      }

      // Assuming matchService is injected in your class
      const [event, ldo, sponsors] = await Promise.all([
        this.eventService.findById(eventId),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.sponsorService.find({ event: eventId }),
      ]);

      const [multiplayer, weight] = await Promise.all([
        this.playerStatsService.proStatFindOne({ _id: event.multiplayer }),
        this.playerStatsService.proStatFindOne({ _id: event.weight }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'event, teams, ldo, sponsors, multiplayer, weight',
        data: {
          event,
          teams: teams as CustomTeam[],
          ldo,
          sponsors,
          multiplayer,
          weight,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getEvent(eventId: string): Promise<GetEventResponse> {
    try {
      // Check if the event is in the cache

      // If not cached, fetch from the database
      const eventExist = await this.eventService.findById(eventId);
      if (!eventExist) return AppResponse.notFound('Event');

      return {
        code: HttpStatus.OK,
        success: true,
        data: eventExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
