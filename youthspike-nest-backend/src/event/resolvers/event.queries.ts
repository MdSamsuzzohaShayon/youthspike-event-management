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
import { EEventItem, Event } from '../event.schema';
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
import { EventFilterInput } from './event.input';
import { Match } from 'src/match/match.schema';
import { Team } from 'src/team/team.schema';
import { Player } from 'src/player/player.schema';

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

  async getEventDetails(eventId: string, filter: EventFilterInput): Promise<GetEventDetailsResponse> {
    try {
      let matches = [];
      let teams = [];
      let players = [];
      let event = null;
      let ldo = null;
      let groups = [];
      let sponsors = [];
      if (!filter.limit) {
        // Assuming matchService is injected in your class
        [event, matches, teams, players, ldo, groups, sponsors] = await Promise.all([
          this.eventService.findById(eventId),
          this.matchService.find({ event: eventId }),
          this.teamService.find({ event: eventId }),
          this.playerService.find({ events: { $in: [eventId] } }),
          this.ldoService.findOne({ events: { $in: [eventId] } }),
          this.groupService.find({ event: eventId }),
          this.sponsorService.find({ event: eventId }),
        ]);
      } else {
        // Collect IDs directly in sets for uniqueness
        const teamIds = new Set<string>();
        const matchIds = new Set<string>();

        if (filter.item === EEventItem.MATCH) {
          matches = await this.matchService.find({ event: eventId }, filter.limit);

          matches.forEach((m) => {
            if (m.teamA) teamIds.add(String(m.teamA));
            if (m.teamB) teamIds.add(String(m.teamB));
          });

          const tIds = [...teamIds].filter((t) => t && t !== 'null');
          [teams, players] = await Promise.all([
            this.teamService.find({ event: eventId, _id: { $in: tIds } }),
            this.playerService.find({ event: eventId, teams: { $in: tIds } }),
          ]);
        } else if (filter.item === EEventItem.TEAM) {
          teams = await this.teamService.find({ event: eventId }, filter.limit);

          teams.forEach((t) => t.matches?.forEach((m) => matchIds.add(String(m))));

          const mIds = [...matchIds];
          [matches, players] = await Promise.all([
            this.matchService.find({ event: eventId, _id: { $in: mIds } }),
            this.playerService.find({ event: eventId, matches: { $in: mIds } }),
          ]);
        } else if (filter.item === EEventItem.PLAYER) {
          players = await this.playerService.find({ event: eventId }, filter.limit);

          players.forEach((p) => p.teams?.forEach((t) => teamIds.add(String(t))));

          const tIds = [...teamIds];
          [teams, matches] = await Promise.all([
            this.teamService.find({ _id: { $in: tIds } }),
            this.matchService.find({
              $or: [{ teamA: { $in: tIds } }, { teamB: { $in: tIds } }],
            }),
          ]);
        }
      }

      // Fetch secondary resources in parallel
      [event, ldo, groups, sponsors] = await Promise.all([
        this.eventService.findById(eventId),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.groupService.find({ event: eventId }),
        this.sponsorService.find({ event: eventId }),
      ]);

      if(!event) return AppResponse.notFound("Event");

      const mIds = matches.map((m) => String(m._id));
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: mIds } }),
        this.netService.find({ match: { $in: mIds } }),
      ]);

      // --- Optimize player stats ---
      // Precompute player->nets mapping
      const playerToNets: Record<string, Net[]> = {};
      for (const net of nets) {
        [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].filter(Boolean).forEach((pid) => {
          if (!playerToNets[pid]) playerToNets[pid] = [];
          playerToNets[pid].push(net);
        });
      }

      // Batch Redis queries for all players
      const allRedisKeys = players.flatMap((p) => (playerToNets[p._id] || []).map((net) => playerKey(p._id, net._id)));
      const redisResults = await Promise.all(allRedisKeys.map((key) => this.redisService.get(key)));
      const redisStats = (redisResults as CustomPlayerStats[]).filter(Boolean);

      // Organize Redis stats by playerId
      const redisByPlayer: Record<string, CustomPlayerStats[]> = {};
      for (const stat of redisStats) {
        if (!redisByPlayer[stat.player]) redisByPlayer[stat.player] = [];
        redisByPlayer[stat.player].push(stat);
      }

      // Collect missing nets for DB fetch
      const missingStatsQueries: any[] = [];
      players.forEach((player) => {
        const netsOfPlayer = playerToNets[player._id] || [];
        const redisNetIds = new Set((redisByPlayer[player._id] || []).map((s) => s.net));
        const missingNetIds = netsOfPlayer.map((net) => String(net._id)).filter((id) => !redisNetIds.has(id));

        if (missingNetIds.length) {
          missingStatsQueries.push(this.playerStatsService.find({ player: player._id, net: { $in: missingNetIds } }));
        }
      });

      const dbStatsResults = await Promise.all(missingStatsQueries);

      // Normalize DB stats
      const statsOfPlayer: Record<string, CustomPlayerStats[]> = {};
      dbStatsResults.flat().forEach((ps) => {
        const plainObj = ps.toObject();
        const stat: CustomPlayerStats = {
          ...plainObj,
          net: String(plainObj.net),
          player: String(plainObj.player),
          match: String(plainObj.match),
        };
        if (!statsOfPlayer[stat.player]) statsOfPlayer[stat.player] = [];
        statsOfPlayer[stat.player].push(stat);
      });

      // Merge redis + db + fill empty nets
      players.forEach((player) => {
        const netsOfPlayer = playerToNets[player._id] || [];
        const merged = [...(redisByPlayer[player._id] || []), ...(statsOfPlayer[player._id] || [])];
        const existingNetIds = new Set(merged.map((s) => s.net));

        const emptyStats = netsOfPlayer
          .map((net) => String(net._id))
          .filter((id) => !existingNetIds.has(id))
          .map((netId) => ({
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
            player: String(player._id),
            match: netsOfPlayer.find((n) => String(n._id) === netId)?.match?.toString() || '',
          }));

        statsOfPlayer[player._id] = [...merged, ...emptyStats];
      });

      // Prepare response
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'event, matches, teams, players, ldo, groups, rounds, nets, sponsors',
        data: {
          event,
          matches: matches.map((m) => ({
            ...m.toObject(),
            group: String(typeof m.group === 'object' ? (m.group as any)._id : m.group),
          })),
          teams: teams.map((t) => ({
            ...t.toObject(),
            matches: t.matches?.map((m) => String(typeof m === 'object' ? (m as any)._id : m)) || [],
          })),
          players: players.map((p) => ({
            ...p.toObject(),
            teams: p.teams?.map((t) => String(typeof t === 'object' ? (t as any)._id : t)) || [],
            username: p?.username || 'Unknown',
          })),
          ldo,
          groups: groups.map((g) => ({
            ...g.toObject(),
            teams: g.teams?.map((t) => String(typeof t === 'object' ? (t as any)._id : t)) || [],
          })),
          rounds: rounds.map((r) => ({
            ...r.toObject(),
            match: String(typeof r.match === 'object' ? (r.match as any)._id : r.match),
          })),
          nets: nets.map((n) => ({
            ...n.toObject(),
            match: String(typeof n.match === 'object' ? (n.match as any)._id : n.match),
          })),
          sponsors,
          statsOfPlayer: Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
            playerId,
            stats,
          })),
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
      if (
        loggedUser.role === UserRole.captain ||
        loggedUser.role === UserRole.co_captain ||
        loggedUser.role === UserRole.player
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
