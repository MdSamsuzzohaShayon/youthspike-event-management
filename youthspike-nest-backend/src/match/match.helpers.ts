import { Injectable } from "@nestjs/common";
import { PlayerRankingService } from "src/player-ranking/player-ranking.service";
import { PlayerService } from "src/player/player.service";
import { TeamService } from "src/team/team.service";
import { MatchService } from "./match.service";
import { RedisService } from "src/redis/redis.service";
import { ServerReceiverOnNetService } from "src/server-receiver-on-net/server-receiver-on-net.service";
import { Match } from "./match.schema";
import { NetService } from "src/net/net.service";
import { EServerPositionPair, EServerReceiverAction, ServerReceiverOnNet, ServerReceiverSinglePlay } from "src/server-receiver-on-net/server-receiver-on-net.schema";
import { RoundService } from "src/round/round.service";
import { RoomService } from "src/room/room.service";
import { PlayerRanking } from "src/player-ranking/player-ranking.schema";
import { Net } from "src/net/net.schema";
import { netKey } from "src/util/helper";

@Injectable()
export class MatchHelpers {

    constructor(
        private readonly teamService: TeamService,
        private readonly playerService: PlayerService,
        private readonly playerRankingService: PlayerRankingService,
        private readonly matchService: MatchService,
        private readonly roundService: RoundService,
        private readonly roomService: RoomService,
        private readonly redisService: RedisService,
        private readonly netService: NetService,
        private readonly serverReceiverOnNetService: ServerReceiverOnNetService,
      ) {}

      


  // ===== Healper Functions =====
  private async getNetData(match: Match) {
    const matchId = match._id.toString();
    const netList = await this.netService.find({ match: matchId });
    if (!netList.length) return { netList: [], netIds: [] };
    return {
      netList,
      netIds: netList.map((net) => net._id.toString()),
    };
  }

  private async getServerReceiverCachedData<T>(
    keys: string[],
    netIds: string[],
  ): Promise<{ cached: ServerReceiverOnNet[]; missedIds: string[] }> {
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

  private async getPlayCachedData<T>(
    keys: string[],
    netIds: string[],
  ): Promise<{ cached: ServerReceiverSinglePlay[]; missedIds: string[] }> {
    const redisResults = await Promise.all(keys.map((key) => this.redisService.get<ServerReceiverSinglePlay>(key)));

    const cached: ServerReceiverSinglePlay[] = [];
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

  async deleteSingle(matchExist: Match) {
    const updatePromises = [];
    const roundIds = matchExist.rounds.map((m) => m.toString());
    if (roundIds.length > 0) {
      updatePromises.push(this.roundService.deleteMany({ _id: { $in: roundIds } }));
    }
    const netIds = matchExist.nets.map((n) => n.toString());
    if (netIds.length > 0) {
      updatePromises.push(this.roundService.deleteMany({ _id: { $in: netIds } }));
    }

    updatePromises.push(this.teamService.updateOne({ _id: matchExist.teamA }, { $pull: { matches: matchExist._id } }));
    updatePromises.push(this.teamService.updateOne({ _id: matchExist.teamB }, { $pull: { matches: matchExist._id } }));
    updatePromises.push(this.roomService.deleteOne({ _id: matchExist.room }));
    updatePromises.push(this.matchService.deleteMany({ _id: matchExist._id }));
    await Promise.all(updatePromises);
  }

  async getTeamRanking(
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

  // Updated resolver fields
  // ===== Common Helper Functions =====
  async getServerReceiverData(match: Match): Promise<{
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

  async getCachedServerReceivers(
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

  async processServerReceiver(
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

  normalizeServerReceiver(receiver: ServerReceiverOnNet): ServerReceiverOnNet {
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

  normalizeSinglePlay(play: ServerReceiverSinglePlay): ServerReceiverSinglePlay {
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
}
