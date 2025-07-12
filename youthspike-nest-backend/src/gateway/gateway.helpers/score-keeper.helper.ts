import { Injectable } from '@nestjs/common';
import { GatewayRedisService } from '../gateway.redis';
import { GatewayService } from '../gateway.service';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { initPlayerStat } from 'src/util/helper';
import { ServerReceiverOnNet } from 'src/net/net.schema';

@Injectable()
export class ScoreKeeperHelper {
  constructor(private readonly redis: GatewayRedisService, private readonly gateway: GatewayService) {}

  /* ───────────────────────────── helpers for “net” ─────────────────────────── */

  private netKey(netId: string, room: string) {
    return `sr:${netId}:${room}`;
  }

  async loadNetAction(netId: string, room: string): Promise<ServerReceiverOnNet> {
    const action = await this.redis.getAction(this.netKey(netId, room));
    if (!action) {
      throw new Error(`Net cache missing for net:${netId} room:${room}`);
    }
    return action as ServerReceiverOnNet;
  }

  async saveNetAction(netId: string, room: string, data: ServerReceiverOnNet) {
    await this.redis.setAction(this.netKey(netId, room), data);
  }

  /* ─────────────────────────── helpers for “players” ───────────────────────── */

  private playerKey(id: string) {
    return `player:${id}`;
  }

  /**
   * Ensure a list of player stats are loaded (and lazily created if missing).
   * Returns a `{[playerId]: PlayerStats}` map ready for mutation.
   */
  async getPlayerStats(matchId: string, ids: string[]) {
    const cached = await Promise.all(ids.map((id) => this.redis.getAction(this.playerKey(id))));

    return ids.reduce<Record<string, PlayerStats>>((acc, id, idx) => {
      acc[id] = cached[idx] ?? initPlayerStat(matchId, id);
      return acc;
    }, {});
  }

  /**
   * Persist a map of `{[playerId]: PlayerStats}` back to Redis in parallel.
   */
  async savePlayerStats(statsMap: Record<string, PlayerStats>) {
    await Promise.all(Object.entries(statsMap).map(([id, data]) => this.redis.setAction(this.playerKey(id), data)));
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
  rotateServerReceiver(net: ServerReceiverOnNet) {
    [net.server, net.receiver] = [net.receiver, net.server];
    [net.servingPartner, net.receivingPartner] = [net.receivingPartner, net.servingPartner];
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
}
