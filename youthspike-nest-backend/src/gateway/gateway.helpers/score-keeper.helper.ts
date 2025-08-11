import { Injectable } from '@nestjs/common';
import { GatewayRedisService } from '../gateway.redis';
import { GatewayService } from '../gateway.service';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { initPlayerStat, netKey, singlePlayKey } from 'src/util/helper';
import {
  EServerPositionPair,
  EServerReceiverAction,
  ServerReceiverOnNet,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';

@Injectable()
export class ScoreKeeperHelper {
  constructor(private readonly redis: GatewayRedisService, private readonly gateway: GatewayService) {}

  /* ───────────────────────────── helpers for “net” ─────────────────────────── */

  async loadNetAction(netId: string, room: string): Promise<ServerReceiverOnNet> {
    let action = await this.redis.getAction(netKey(netId, room));
    if (!action) {
      const { serverReceiverOnNetService } = await this.gateway.getServices();
      action = await serverReceiverOnNetService.findOne({ net: netId });
      if (!action) {
        throw new Error(`Net is missing for net:${netId} room:${room}`);
      }
    }
    return action as ServerReceiverOnNet;
  }

  async loadAllSinglePlayAction(netId: string, room: string, limit: number): Promise<ServerReceiverSinglePlay[]> {
    const singlePlays: ServerReceiverSinglePlay[] = [];
    for (let i = 0; i < limit; i++) {
      const action = await this.redis.getAction(singlePlayKey(netId, room, i + 1));
      if (action) {
        singlePlays.push(action as ServerReceiverSinglePlay);
      }
    }
    return singlePlays as ServerReceiverSinglePlay[];
  }

  async loadSinglePlayAction(netId: string, room: string, play: number): Promise<ServerReceiverSinglePlay> {
    let action = await this.redis.getAction(singlePlayKey(netId, room, play));
    if (!action) {
      const { serverReceiverOnNetService } = await this.gateway.getServices();
      action = await serverReceiverOnNetService.findOneSinglePlay({ net: netId, play });
      if (!action) {
        throw new Error(`Single Play is missing for net:${netId} room:${room} play:${play}`);
      }
    }
    return action as ServerReceiverSinglePlay;
  }

  // Cound be null
  async getSinglePlays(key: string,): Promise<ServerReceiverSinglePlay[]> {
    let action = await this.redis.getAction(key);
    return action || [];
  }

  async saveNetAction(netId: string, room: string, data: ServerReceiverOnNet) {
    await this.redis.setAction(netKey(netId, room), data);
  }

  async saveNetSinglePlayAction(netId: string, room: string, data: ServerReceiverSinglePlay) {
    await this.redis.setAction(singlePlayKey(netId, room, data.play), data);
  }

  async deleteSinglePlayAction(netId: string, room: string, play: number) {
    await this.redis.deleteAction(singlePlayKey(netId, room, play));
  }

  async deleteNetAction(netId: string, room: string) {
    await this.redis.deleteAction(netKey(netId, room));
  }

  /* ─────────────────────────── helpers for “players” ───────────────────────── */

  private playerKey(id: string, netId: string) {
    // A player can play in multiple nets in a match
    return `player:${id}:${netId}`;
  }

  /**
   * Ensure a list of player stats are loaded (and lazily created if missing).
   * Returns a `{[playerId]: PlayerStats}` map ready for mutation.
   */
  async getPlayerStats(netId: string, matchId: string, ids: string[]) {
    const cached = await Promise.all(ids.map((id) => this.redis.getAction(this.playerKey(id, netId)))); // Redis key: <player:id:net>

    return ids.reduce<Record<string, PlayerStats>>((acc, id, idx) => {
      acc[id] = cached[idx] ?? initPlayerStat(netId, matchId, id);
      return acc;
    }, {});
  }

  /**
   * Persist a map of `{[playerId]: PlayerStats}` back to Redis in parallel.
   */
  async savePlayerStats(statsMap: Record<string, PlayerStats>) {
    await Promise.all(
      Object.entries(statsMap).map(([id, data]) => this.redis.setAction(this.playerKey(id, data.net.toString()), data)),
    ); // Redis key: <player:id:net>
  }

  async deletePlayerStats(netId: string, ids: string[]) {
    await Promise.all(ids.map((id) => this.redis.deleteAction(this.playerKey(id, netId)))); // Redis key: <player:id:net>
  }

  /**
   * Tiny utility to mutate a stat object with an “increments” map.
   */
  increment(stats: PlayerStats, inc: Partial<Record<keyof PlayerStats, number>>) {
    for (const [k, v] of Object.entries(inc)) {
      //   stats[k as keyof PlayerStats] += v as number;
      const key = k as keyof PlayerStats;
      (stats[key] as number) += v as number;
    }
  }

  /* ─────────────────────────── helpers for “scoring” ───────────────────────── */

  updateScore(net: ServerReceiverOnNet, team: 'A' | 'B') {
    if (team === 'A') net.teamAScore += 1;
    else net.teamBScore += 1;
  }

  rotateServer(net: ServerReceiverOnNet) {
    [net.server, net.servingPartner] = [net.servingPartner, net.server];
  }
  rotateReceiver(net: ServerReceiverOnNet) {
    [net.receiver, net.receivingPartner] = [net.receivingPartner, net.receiver];
  }
  rotateServerReceiver(net: ServerReceiverOnNet, receivingTeamScore: number) {
    if (net.play < 2) {
      // Less than 2 plays: just swap server/receiver and their partners
      [net.server, net.receiver] = [net.receiver, net.server];
      [net.servingPartner, net.receivingPartner] = [net.receivingPartner, net.servingPartner];
    } else {
      let tempReceiver = null, tempReceivingPartner = null;
      tempReceiver = net.server;
      tempReceivingPartner = net.servingPartner
      // If receiver team score is even
      if (receivingTeamScore % 2 === 0) {
        // Even score: setter (receivingPartner) serves
        // Serving position change here
        if(net.serverPositionPair === EServerPositionPair.PAIR_A_TOP){
          net.serverPositionPair = EServerPositionPair.PAIR_B_RIGHT;
        }else if(net.serverPositionPair === EServerPositionPair.PAIR_A_LEFT){
          net.serverPositionPair = EServerPositionPair.PAIR_B_BOTTOM;
        }else if (net.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT){
          net.serverPositionPair = EServerPositionPair.PAIR_A_TOP
        }else if (net.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM){
          net.serverPositionPair = EServerPositionPair.PAIR_A_LEFT;
        }
        net.server = net.receivingPartner;
        net.servingPartner = net.receiver;
      } else {
        // Odd score: receiver serves
        // Serving position change here
        if(net.serverPositionPair === EServerPositionPair.PAIR_A_TOP){
          net.serverPositionPair = EServerPositionPair.PAIR_B_BOTTOM;
        }else if(net.serverPositionPair === EServerPositionPair.PAIR_A_LEFT){
          net.serverPositionPair = EServerPositionPair.PAIR_B_RIGHT;
        }else if (net.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT){
          net.serverPositionPair = EServerPositionPair.PAIR_A_LEFT;
        }else if (net.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM){
          net.serverPositionPair = EServerPositionPair.PAIR_A_TOP;
        }
        net.server = net.receiver;
        net.servingPartner = net.receivingPartner;
      }
  
      // Update receiver and partner (opposite team)
      net.receiver = tempReceiver;
      net.receivingPartner = tempReceivingPartner;
    }
  }
  
  /* ──────────────────────────────── misc I/O ──────────────────────────────── */

  async publishRoom(room: string, event: string, payload: unknown) {
    await this.redis.publishToRoom(room, event, payload);
  }

  async publishError(socketId: string, message: string) {
    await this.redis.publishToSocket(socketId, 'error-from-server', message);
  }

  /* ─────────────────────────── helpers for “teams” ─────────────────────────── */

  /**
   * Convenience wrapper that returns team‑A/B player‑id sets for a net id.
   * Use once and reuse locally in each handler.
   */
  async getTeamSets(netId: string) {
    const { netService } = this.gateway.getServices();
    const net = await netService.findById(netId);

    return {
      teamA: new Set([net.teamAPlayerA, net.teamAPlayerB]),
      teamB: new Set([net.teamBPlayerA, net.teamBPlayerB]),
    };
  }


  normalizeSinglePlay(play: ServerReceiverSinglePlay): ServerReceiverSinglePlay {
    return {
      _id: play._id,
      teamAScore: play.teamAScore || 0,
      teamBScore: play.teamBScore || 0,
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
