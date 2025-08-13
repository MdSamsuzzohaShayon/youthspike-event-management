import { Injectable } from '@nestjs/common';
import { GatewayRedisService } from '../gateway.redis';
import { GatewayService } from '../gateway.service';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { initPlayerStat, netKey, playerKey, singlePlayKey } from 'src/util/helper';
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
  async getSinglePlays(key: string): Promise<ServerReceiverSinglePlay[]> {
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

  /**
   * Ensure a list of player stats are loaded (and lazily created if missing).
   * Returns a `{[playerId]: PlayerStats}` map ready for mutation.
   */
  async getPlayerStats(netId: string, matchId: string, ids: string[]) {
    const cached = await Promise.all(ids.map((id) => this.redis.getAction(playerKey(id, netId)))); // Redis key: <player:id:net>

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
      Object.entries(statsMap).map(([id, data]) => this.redis.setAction(playerKey(id, data.net.toString()), data)),
    ); // Redis key: <player:id:net>
  }

  async deletePlayerStats(netId: string, ids: string[]) {
    await Promise.all(ids.map((id) => this.redis.deleteAction(playerKey(id, netId)))); // Redis key: <player:id:net>
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

  rotateReceiver(net: ServerReceiverOnNet) {
    if (net.serverPositionPair === EServerPositionPair.PAIR_A_TOP) {
      net.serverPositionPair = EServerPositionPair.PAIR_A_LEFT;
    } else if (net.serverPositionPair === EServerPositionPair.PAIR_A_LEFT) {
      net.serverPositionPair = EServerPositionPair.PAIR_A_TOP;
    } else if (net.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT) {
      net.serverPositionPair = EServerPositionPair.PAIR_B_BOTTOM;
    } else if (net.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM) {
      net.serverPositionPair = EServerPositionPair.PAIR_B_RIGHT;
    }

    [net.receiver, net.receivingPartner] = [net.receivingPartner, net.receiver];
  }

  rotateServerReceiver(net: ServerReceiverOnNet, receivingTeamScore: number) {
    const prevServer = net.server;
    const prevServingPartner = net.servingPartner;

    // If receiver team score is even
    // If their score is odd, the player on the left will be selected as server.
    // If their score is even, the player on the right will be selected as server.

    if (receivingTeamScore % 2 === 0) {
      // Even score: setter (receivingPartner) serves
      // Serving position change here
      if (net.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM) {
        // Not working properlu
        net.serverPositionPair = EServerPositionPair.PAIR_A_LEFT;
        net.server = net.receivingPartner;
        net.servingPartner = net.receiver;
        net.receiver = prevServingPartner;
        net.receivingPartner = prevServer;
      }else if (net.serverPositionPair === EServerPositionPair.PAIR_A_TOP) {
        net.serverPositionPair = EServerPositionPair.PAIR_B_RIGHT;
        net.server = net.receivingPartner;
        net.servingPartner = net.receiver;
        net.receiver = prevServingPartner;
        net.receivingPartner = prevServer;
      }else if (net.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT) {
        net.serverPositionPair = EServerPositionPair.PAIR_A_LEFT;
        net.server = net.receiver;
        net.servingPartner = net.receivingPartner;
        net.receiver = prevServer;
        net.receivingPartner = prevServingPartner;
      }else if (net.serverPositionPair === EServerPositionPair.PAIR_A_LEFT) {
        net.serverPositionPair = EServerPositionPair.PAIR_B_RIGHT;
        net.server = net.receiver;
        net.servingPartner = net.receivingPartner;
        net.receiver = prevServer;
        net.receivingPartner = prevServingPartner;
      }
      // net.server = net.receivingPartner;
      // net.servingPartner = net.receiver;
    } else {
      // Find a player from receiving team who is on the left
      if (net.serverPositionPair === EServerPositionPair.PAIR_A_TOP) {
        // Receiver will be the server now
        net.server = net.receiver;
        // New server position
        net.serverPositionPair = EServerPositionPair.PAIR_B_BOTTOM;
        net.servingPartner = net.receivingPartner;

        // according to previous server position set current receiver and receiving partner
        // Set receiver who was previously at the pait A top, since our new server position is pair b bottom
        net.receiver = prevServer;
        net.receivingPartner = prevServingPartner;
      } else if (net.serverPositionPair === EServerPositionPair.PAIR_A_LEFT) {
        // Receiver will be the server now
        net.server = net.receivingPartner;
        // New server position
        net.serverPositionPair = EServerPositionPair.PAIR_B_BOTTOM;
        net.servingPartner = net.receiver;

        // according to previous server position set current receiver and receiving partner
        // Set receiver who was previously at the pait A top, since our new server position is pair b bottom
        net.receiver = prevServingPartner;
        net.receivingPartner = prevServer;
      } else if (net.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM) {
        net.server = net.receiver;
        net.serverPositionPair = EServerPositionPair.PAIR_A_TOP;
        net.servingPartner = net.receivingPartner;
        net.receiver = prevServer;
        net.receivingPartner = prevServingPartner;
      } else if (net.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT) {
        net.server = net.receivingPartner;
        net.serverPositionPair = EServerPositionPair.PAIR_A_TOP;
        net.servingPartner = net.receiver;
        net.receiver = prevServingPartner;
        net.receivingPartner = prevServer;
      }
      // Find server position, according to server position, we can find that who is on the left hand side of the net in receiving team
      // If player on the left hand side is found then make him server
      // Set position of new server
      // according to previous server position set current receiver and receiving partner

      // net.server = net.receiver;
      // net.servingPartner = net.receivingPartner;
    }

    // According previous server position set receiver and receiving partner
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
