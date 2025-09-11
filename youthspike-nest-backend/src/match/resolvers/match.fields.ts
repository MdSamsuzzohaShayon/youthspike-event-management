import { Injectable } from '@nestjs/common';
import { Match } from '../match.schema';
import { TeamService } from 'src/team/team.service';
import { GroupService } from 'src/group/group.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { Net } from 'src/net/net.schema';
import {
  EServerPositionPair,
  EServerReceiverAction,
  ServerReceiverOnNet,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { RedisService } from 'src/redis/redis.service';
import { netKey, singlePlayKey } from 'src/util/helper';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import { EventService } from 'src/event/event.service';
import { RoomService } from 'src/room/room.service';
import { PlayerRanking } from 'src/player-ranking/player-ranking.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from '../match.service';

@Injectable()
export class MatchFields {
  constructor(
    private serverReceiverOnNetService: ServerReceiverOnNetService,
    private teamService: TeamService,
    private redisService: RedisService,
    private netService: NetService,
    private roundService: RoundService,
    private groupService: GroupService,
    private eventService: EventService,
    private roomService: RoomService,
    private playerRankingService: PlayerRankingService,
    private playerService: PlayerService,
    private matchService: MatchService,
  ) {}

  // Helper functions
  private async getNetData(match: Match) {
    const matchId = match._id.toString();
    const netList = await this.netService.find({ match: matchId });
    if (!netList.length) return { netList: [], netIds: [] };
    return {
      netList,
      netIds: netList.map((net) => net._id.toString()),
    };
  }

  private async getTeamRanking(
    match: Match,
    teamId: string,
    rankingId: string,
    rankingField: string,
  ): Promise<PlayerRanking> {
    try {
      let playerRanking = await this.playerRankingService.findOne({ _id: rankingId });
      if (!playerRanking) {
        const teamExist = await this.teamService.findOne({ _id: teamId });
        const playerList = await this.playerService.find({ _id: { $in: teamExist.players } });
        const rankingData = {
          rankLock: false,
          team: teamExist._id,
          rankings: [],
          match: match._id,
        };
        const rankings = [];
        for (let pi = 0; pi < playerList.length; pi += 1) {
          rankings.push({ player: playerList[pi]._id, rank: pi + 1 });
        }
        rankingData.rankings = rankings;
        playerRanking = await this.playerRankingService.create(rankingData);
        await Promise.all([
          this.teamService.updateOne({ _id: teamExist._id }, { $addToSet: { playerRankings: playerRanking._id } }),
          this.matchService.updateOne({ _id: match._id }, { $set: { [rankingField]: playerRanking._id } }),
        ]);
      }
      return playerRanking;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async getServerReceiverData(match: Match): Promise<{
    netList: Net[];
    netIds: string[];
    netMap: Map<string, Net>;
    room: string;
  }> {
    const { netList, netIds } = await this.getNetData(match);
    const netMap = new Map(netList.map((n) => [n._id.toString(), n]));
    const room = match.room?.toString?.() || '';
    return { netList, netIds, netMap, room };
  }

  private async getCachedServerReceivers(
    keys: string[],
    netIds: string[],
  ): Promise<{
    cached: ServerReceiverOnNet[];
    missedIds: string[];
  }> {
    const redisResults = await Promise.all(keys.map((key) => this.redisService.get<ServerReceiverOnNet>(key)));

    const cached: ServerReceiverOnNet[] = [];
    const cachedNetIdSet: Set<string> = new Set();

    redisResults.forEach((result) => {
      if (result) {
        cached.push(result);
        cachedNetIdSet.add(result?.net?.toString() || '');
      }
    });

    const missedIds = netIds.filter((netId) => !cachedNetIdSet.has(netId.toString()));
    return { cached, missedIds };
  }

  private async processServerReceiver(
    receiver: any,
    netMap: Map<string, Net>,
    room: string,
  ): Promise<ServerReceiverOnNet> {
    const netId = receiver.net.toString();
    const net = netMap.get(netId);
    if (!net) return null;

    const receiverObj = typeof receiver?.toObject === 'function' ? receiver?.toObject() : receiver;

    receiverObj.mutate = (receiverObj.teamAScore || 0) + (receiverObj.teamBScore || 0);

    if (receiverObj.play > receiverObj.mutate) {
      receiverObj.play = receiverObj.mutate;
    }

    const key = netKey(netId, room);
    await Promise.all([
      this.redisService.set(key, receiverObj),
      this.serverReceiverOnNetService.updateOne({ net: netId }, receiverObj),
    ]);

    return receiverObj;
  }

  private normalizeServerReceiver(receiver: ServerReceiverOnNet): ServerReceiverOnNet {
    return {
      ...receiver,
      serverId: String(receiver.server ?? ''),
      matchId: String(receiver.match ?? ''),
      netId: String(receiver.net ?? ''),
      receiverId: String(receiver.receiver ?? ''),
      receivingPartnerId: String(receiver.receivingPartner ?? ''),
      servingPartnerId: String(receiver.servingPartner ?? ''),
      roundId: String(receiver.round ?? ''),
      serverPositionPair: receiver?.serverPositionPair || EServerPositionPair.PAIR_A_TOP,
      teamAScore: receiver?.teamAScore || 0,
      teamBScore: receiver?.teamBScore || 0,
    };
  }

  private normalizeSinglePlay(play: ServerReceiverSinglePlay): ServerReceiverSinglePlay {
    return {
      _id: play._id,
      teamAScore: play?.teamAScore || 0,
      teamBScore: play?.teamBScore || 0,
      play: play.play || 1,

      action: play.action || EServerReceiverAction.SERVER_DO_NOT_KNOW,
      serverPositionPair: play.serverPositionPair || EServerPositionPair.PAIR_A_TOP,

      match: play.match || play.matchId || '',
      net: play.net || play.netId || '',
      server: play.server || play.serverId || '',
      receiver: play.receiver || play.receiverId || '',
      receivingPartner: play.receivingPartner || play.receivingPartnerId || '',
      servingPartner: play.servingPartner || play.servingPartnerId || '',

      matchId: String(play.match) || play.matchId || '',
      netId: String(play.net) || play.netId || '',
      serverId: String(play.server) || play.serverId || '',
      receiverId: String(play.receiver) || play.receiverId || '',
      receivingPartnerId: String(play.receivingPartner) || play.receivingPartnerId || '',
      servingPartnerId: String(play.servingPartner) || play.servingPartnerId || '',
    };
  }

  async serverReceiverOnNet(match: Match): Promise<ServerReceiverOnNet[]> {
    try {
      const { netIds, netMap, room } = await this.getServerReceiverData(match);
      if (!netIds.length) return [];

      const redisKeys = netIds.map((netId) => netKey(netId, room));
      const { cached: cachedReceivers, missedIds: missedNetIds } = await this.getCachedServerReceivers(
        redisKeys,
        netIds,
      );

      // Process cached data
      const processedCached = cachedReceivers.map(this.normalizeServerReceiver);

      // Get missed data from DB if needed
      if (missedNetIds.length === 0) return processedCached;

      const missedReceivers = await this.serverReceiverOnNetService.find({
        net: { $in: missedNetIds },
      });

      // Process and cache missed receivers
      const updatedReceivers = await Promise.all(
        missedReceivers.map((sr) => this.processServerReceiver(sr, netMap, room)),
      );

      return [...processedCached, ...updatedReceivers.filter(Boolean)];
    } catch (error) {
      console.error('serverReceiverOnNet error:', error);
      return [];
    }
  }

  async serverReceiverSinglePlay(match: Match): Promise<ServerReceiverSinglePlay[]> {
    try {
      const { netIds, room } = await this.getServerReceiverData(match);
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
      const processedPlayCached = cachedPlays.map(this.normalizeSinglePlay);

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
          return this.normalizeSinglePlay(dataToCache as any);
        }),
      );

      return [...processedPlayCached, ...newMissedPlays];
    } catch (error) {
      console.error('serverReceiverSinglePlay error:', error);
      return [];
    }
  }

  // Fields population
  async teamA(match: Match) {
    try {
      if (!match.teamA) return null;
      const teamExist = await this.teamService.findById(match.teamA.toString());
      return teamExist;
    } catch {
      return null;
    }
  }

  async teamB(match: Match) {
    try {
      if (!match.teamB) return null;
      return this.teamService.findById(match.teamB.toString());
    } catch {
      return null;
    }
  }

  async rounds(match: Match) {
    try {
      return this.roundService.find({ match: match._id.toString() });
    } catch {
      return [];
    }
  }

  async nets(match: Match) {
    try {
      return this.netService.find({ match: match._id.toString() });
    } catch {
      return [];
    }
  }


  async event(match: Match) {
    try {
      return this.eventService.findById(match.event.toString());
    } catch {
      return null;
    }
  }

  async group(match: Match) {
    try {
      if (!match.group) return null;
      return this.groupService.findById(match.group?.toString());
    } catch {
      return null;
    }
  }

  async room(match: Match) {
    try {
      if (!match.room) return null;
      const findRoom = await this.roomService.findOne({ _id: match.room.toString() });
      return findRoom;
    } catch {
      return null;
    }
  }

  async teamARanking(match: Match): Promise<PlayerRanking> {
    return this.getTeamRanking(match, match.teamA.toString(), match.teamARanking.toString(), 'teamARanking');
  }

  async teamBRanking(match: Match): Promise<PlayerRanking> {
    return this.getTeamRanking(match, match.teamB.toString(), match.teamBRanking.toString(), 'teamBRanking');
  }
}
