import { HttpStatus, Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventService } from '../event.service';
import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';
import { UserService } from 'src/user/user.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { tokenToUser } from 'src/util/helper';
import { Event } from '../event.schema';
import {
  GetEventDetailsResponse,
  GetEventResponse,
  GetEventsResponse,
  GetPlayerEventSettingResponse,
} from './event.response';
import { IEventQueries } from '../resolvers/event.types';

@Injectable()
export class EventQueries implements IEventQueries {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private playerService: PlayerService,
    private playerStatsService: PlayerStatsService,
    private matchService: MatchService,
    private userService: UserService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
    private sponsorService: SponsorService,
  ) {}

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
          case UserRole.admin:
            if (!directorId) {
              return AppResponse.handleError({
                success: false,
                message: 'You must select a director in order to update an event!',
              });
            }
            newDirectorId = directorId;
            break;
          default:
            break;
        }
      }

      // Filter events based on director ID
      const filter: FilterQuery<Event> = {};
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
        data: events,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getEventDetails(eventId: string): Promise<GetEventDetailsResponse> {
    try {
      // Assuming matchService is injected in your class
      const [event, matches, teams, players, ldo, groups, sponsors] = await Promise.all([
        this.eventService.findById(eventId),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
        this.playerService.find({ events: { $in: [eventId] } }),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.groupService.find({ event: eventId }),
        this.sponsorService.find({ event: eventId }),
      ]);

      const matchIds = matches.map((m) => m._id.toString());
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'event, matches, teams, players, ldo, groups, rounds, nets, sponsors',
        data: { 
          event, 
          matches: matches.map(m => ({ ...m.toObject(), group: typeof m.group === 'object' ? m.group._id : m.group })), 
          teams: teams.map(t => ({ ...t.toObject(), matches: t.matches?.map(m => typeof m === 'object' ? m._id : m) || [] })), 
          players: players.map(p => ({ ...p.toObject(), teams: p.teams?.map(t => typeof t === 'object' ? t._id : t) || [] })), 
          ldo, 
          groups: groups.map(g => ({ ...g.toObject(), teams: g.teams?.map(t => typeof t === 'object' ? t._id : t) || [] })), 
          rounds: rounds.map(r => ({ ...r.toObject(), match: typeof r.match === 'object' ? r.match._id : r.match })), 
          nets: nets.map(n => ({ ...n.toObject(), match: typeof n.match === 'object' ? n.match._id : n.match })), 
          sponsors 
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
      if (!loggedUser) return AppResponse.unauthorized();

      const teams = await this.teamService.find({ event: eventId });
      if(loggedUser.role === UserRole.captain || loggedUser.role === UserRole.co_captain){
        const playerExist = await this.playerService.findOne({$or: [{_id: loggedUser.captainplayer}, {_id: loggedUser.cocaptainplayer}]});
        if(!playerExist) return AppResponse.notFound("Player");
        return {
          code: HttpStatus.OK,
          success: true,
          message: 'event, teams, ldo, sponsors, multiplayer, weight, stats',
          data: { 
            player: { ...playerExist.toObject(), teams: playerExist.teams?.map(t => typeof t === 'object' ? t._id : t) || [] }, 
            teams: teams.map(t => ({ ...t.toObject(), matches: t.matches?.map(m => typeof m === 'object' ? m._id : m) || [] }))
          },
        };
      }

      // Assuming matchService is injected in your class
      const [event, ldo, sponsors] = await Promise.all([
        this.eventService.findById(eventId),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.sponsorService.find({ event: eventId }),
      ]);
      
      const [multiplayer, weight, stats] = await Promise.all([
        this.playerStatsService.proStatFindOne({_id: event.multiplayer}),
        this.playerStatsService.proStatFindOne({_id: event.weight}),
        this.playerStatsService.proStatFindOne({_id: event.stats}),
      ]);



      return {
        code: HttpStatus.OK,
        success: true,
        message: 'event, teams, ldo, sponsors, multiplayer, weight, stats',
        data: { 
          event, 
          teams: teams.map(t => ({ ...t.toObject(), matches: t.matches?.map(m => typeof m === 'object' ? m._id : m) || [] })), 
          ldo, 
          sponsors, 
          multiplayer, 
          weight, 
          stats 
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
