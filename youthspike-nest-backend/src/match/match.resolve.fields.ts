import { EventService } from 'src/event/event.service';
import { GroupService } from 'src/group/group.service';
import { NetService } from 'src/net/net.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { RoomService } from 'src/room/room.service';
import { RoundService } from 'src/round/round.service';
import { TeamService } from 'src/team/team.service';
import { MatchHelpers } from './match.helpers';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import { RedisService } from 'src/redis/redis.service';
import { Match } from './match.schema';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { netKey, singlePlayKey } from 'src/util/helper';
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';

export class MatchResolveFields {
  constructor(
    private readonly teamService: TeamService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly eventService: EventService,
    private readonly groupService: GroupService,
    private readonly roomService: RoomService,
    private readonly playerRankingService: PlayerRankingService,
    private readonly helpers: MatchHelpers,
    private readonly serverReceiverOnNetService: ServerReceiverOnNetService,
    private readonly redisService: RedisService,
  ) {}

  //   @ResolveField()
  async teamA( match: Match) {
    try {
      if (!match.teamA) return null;
      const teamExist = await this.teamService.findById(match.teamA.toString());
      return teamExist;
    } catch {
      return null;
    }
  }

//   @ResolveField()
  async teamB( match: Match) {
    try {
      if (!match.teamB) return null;
      return this.teamService.findById(match.teamB.toString());
    } catch {
      return null;
    }
  }

//   @ResolveField((returns) => [Round])
  async rounds( match: Match) {
    try {
      return this.roundService.find({ match: match._id.toString() });
    } catch {
      return [];
    }
  }

//   @ResolveField((returns) => [Round])
  async nets( match: Match) {
    try {
      return this.netService.find({ match: match._id.toString() });
    } catch {
      return [];
    }
  }

//   @ResolveField(() => [ServerReceiverOnNet])
  async serverReceiverOnNet( match: Match): Promise<ServerReceiverOnNet[]> {
    try {
      const { netIds, netMap, room } = await this.helpers.getServerReceiverData(match);
      if (!netIds.length) return [];

      const redisKeys = netIds.map((netId) => netKey(netId, room));
      const { cached: cachedReceivers, missedIds: missedNetIds } = await this.helpers.getCachedServerReceivers(
        redisKeys,
        netIds,
      );

      // Process cached data
      const processedCached = cachedReceivers.map(this.helpers.normalizeServerReceiver);

      // Get missed data from DB if needed
      if (missedNetIds.length === 0) return processedCached;

      const missedReceivers = await this.serverReceiverOnNetService.find({
        net: { $in: missedNetIds },
      });

      // Process and cache missed receivers
      const updatedReceivers = await Promise.all(
        missedReceivers.map((sr) => this.helpers.processServerReceiver(sr, netMap, room)),
      );

      return [...processedCached, ...updatedReceivers.filter(Boolean)];
    } catch (error) {
      console.error('serverReceiverOnNet error:', error);
      return [];
    }
  }

//   @ResolveField(() => [ServerReceiverSinglePlay])
  async serverReceiverSinglePlay( match: Match): Promise<ServerReceiverSinglePlay[]> {
    try {
      const { netIds, room } = await this.helpers.getServerReceiverData(match);
      if (!netIds.length) return [];

      // First get all server receivers to know what plays we need
      const serverReceivers = await this.serverReceiverOnNet(match);
      if (!serverReceivers.length) return [];

      // Prepare all play keys to check in Redis
      const playKeys: string[] = [];
      const playMap: Map<string, { netId: string; play: number }> = new Map();

      serverReceivers.forEach((sr) => {
        const netId = sr.netId;
        for (let i = 0; i < sr.mutate; i++) {
          const key = singlePlayKey(netId, room, i + 1);
          playKeys.push(key);
          playMap.set(key, { netId, play: sr.mutate || 0 });
        }
      });

      // Get cached plays
      const redisResults = await Promise.all(
        playKeys.map((key) => this.redisService.get<ServerReceiverSinglePlay>(key)),
      );
      const cachedPlays = redisResults.filter(Boolean);

      // Process cached plays
      const processedPlayCached = cachedPlays.map(this.helpers.normalizeSinglePlay);

      // Get play numbers we already have
      const existingPlayNumbers = new Set(cachedPlays.map((play) => play.play));

      // Get missed plays from DB
      const missedPlays = await this.serverReceiverOnNetService.findSinglePlay({
        net: { $in: netIds },
        play: { $nin: [...existingPlayNumbers] },
      });

      // Cache missed plays
      const newMissedPlays = await Promise.all(
        missedPlays.map(async (mp) => {
          const key = singlePlayKey(mp.net?.toString?.() || '', room, mp.play);
          const dataToCache = typeof mp?.toObject === 'function' ? mp?.toObject() : mp;
          await this.redisService.set(key, dataToCache);
          return this.helpers.normalizeSinglePlay(dataToCache as any);
        }),
      );

      return [...processedPlayCached, ...newMissedPlays];
    } catch (error) {
      console.error('serverReceiverSinglePlay error:', error);
      return [];
    }
  }

//   @ResolveField()
  async event( match: Match) {
    try {
      return this.eventService.findById(match.event.toString());
    } catch {
      return null;
    }
  }

//   @ResolveField()
  async group( match: Match) {
    try {
      if (!match.group) return null;
      return this.groupService.findById(match.group?.toString());
    } catch {
      return null;
    }
  }

//   @ResolveField()
  async room( match: Match) {
    try {
      if (!match.room) return null;
      const findRoom = await this.roomService.findOne({ _id: match.room.toString() });
      return findRoom;
    } catch {
      return null;
    }
  }

//   @ResolveField(() => PlayerRanking)
  async teamARanking( match: Match): Promise<PlayerRanking> {
    return this.helpers.getTeamRanking(match, match.teamA.toString(), match.teamARanking.toString(), 'teamARanking');
  }

//   @ResolveField(() => PlayerRanking)
  async teamBRanking( match: Match): Promise<PlayerRanking> {
    return this.helpers.getTeamRanking(match, match.teamB.toString(), match.teamBRanking.toString(), 'teamBRanking');
  }
}
