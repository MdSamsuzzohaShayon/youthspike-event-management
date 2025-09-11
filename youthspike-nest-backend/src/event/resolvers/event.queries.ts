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
import { playerKey, tokenToUser } from 'src/util/helper';
import { Event } from '../event.schema';
import {
  GetEventDetailsResponse,
  GetEventResponse,
  GetEventsResponse,
  GetPlayerEventSettingResponse,
  PlayerStatsEntry,
  // PlayerStatsEntry,
} from './event.response';
import { IEventQueries } from '../resolvers/event.types';
import { RedisService } from 'src/redis/redis.service';
import { Net } from 'src/net/net.schema';
import { CustomPlayerStats } from 'src/player-stats/player-stats.response';

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
    private redisService: RedisService,
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
                message: 'You must select a director in order to get all events!',
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
  
      // Precompute player -> nets map
      const playerToNets: Record<string, Net[]> = {};
      for (const net of nets) {
        [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].forEach((pid) => {
          if (!pid) return;
          if (!playerToNets[pid]) playerToNets[pid] = [];
          playerToNets[pid].push(net);
        });
      }
  
      const statsOfPlayer: Record<string, CustomPlayerStats[]> = {};
  
      // Process players in parallel
      await Promise.all(
        players.map(async (player) => {
          if (!player?._id) return;
  
          const netsOfPlayer = playerToNets[player._id] || [];
          const netIds = netsOfPlayer.map(net => net._id.toString());
  
          // Batch Redis queries
          const redisKeys = netsOfPlayer.map((net) => playerKey(player._id, net._id));
          const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));
  
          const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean) as CustomPlayerStats[];
          const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));
  
          // Query DB for player stats not found in Redis
          const playerstatsDB = await this.playerStatsService.find({ 
            player: player._id,
            net: { $nin: Array.from(redisNetIds) } // Filter out nets already in Redis
          });
  
          // Convert Mongoose documents to plain objects
          const playerstatsDBPlain = playerstatsDB
            .map((ps) => {
              const plainObj = ps.toObject() as any;
              return {
                ...plainObj,
                net: String(plainObj.net),
                player: String(plainObj.player),
                match: String(plainObj.match),
              } as CustomPlayerStats;
            })
            .filter((ps: CustomPlayerStats) => !redisNetIds.has(String(ps.net)));
  
          // Merge both sources
          let mergedStats = [...playerstatsRedis, ...playerstatsDBPlain];
  
          // If no stats found for some nets, create empty records for those nets
          const existingNetIds = new Set(mergedStats.map(ps => ps.net));
          const missingNetIds = netIds.filter(netId => !existingNetIds.has(netId));
  
          const emptyStats = missingNetIds.map(netId => {
            const net = netsOfPlayer.find(n => n._id.toString() === netId);
            return {
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
              net: netId,
              player: player._id.toString(),
              match: net?.match?.toString() || '',
            } as CustomPlayerStats;
          });
  
          statsOfPlayer[player._id] = [...mergedStats, ...emptyStats];
        }),
      );
  
      const statsArray: PlayerStatsEntry[] = Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
        playerId,
        stats,
      }));
  
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'event, matches, teams, players, ldo, groups, rounds, nets, sponsors',
        data: {
          event,
          matches: matches.map((m) => ({
            ...m.toObject(),
            group: typeof m.group === 'object' ? m.group._id : m.group,
          })),
          teams: teams.map((t) => ({
            ...t.toObject(),
            matches: t.matches?.map((m) => (typeof m === 'object' ? m._id : m)) || [],
          })),
          players: players.map((p) => ({
            ...p.toObject(),
            teams: p.teams?.map((t) => (typeof t === 'object' ? t._id : t)) || [],
          })),
          ldo,
          groups: groups.map((g) => ({
            ...g.toObject(),
            teams: g.teams?.map((t) => (typeof t === 'object' ? t._id : t)) || [],
          })),
          rounds: rounds.map((r) => ({ ...r.toObject(), match: typeof r.match === 'object' ? r.match._id : r.match })),
          nets: nets.map((n) => ({ ...n.toObject(), match: typeof n.match === 'object' ? n.match._id : n.match })),
          sponsors,
          statsOfPlayer: statsArray,
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
      if (loggedUser.role === UserRole.captain || loggedUser.role === UserRole.co_captain || loggedUser.role === UserRole.player) {
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
              ...playerExist.toObject(),
              teams: playerExist.teams?.map((t) => (typeof t === 'object' ? t._id : t)) || [],
            },
            teams: teams.map((t) => ({
              ...t.toObject(),
              matches: t.matches?.map((m) => (typeof m === 'object' ? m._id : m)) || [],
            })),
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
          teams: teams.map((t) => ({
            ...t.toObject(),
            matches: t.matches?.map((m) => (typeof m === 'object' ? m._id : m)) || [],
          })),
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
