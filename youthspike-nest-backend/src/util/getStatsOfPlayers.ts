import { Net } from "src/net/net.schema";
import { CustomPlayerStats } from "src/player-stats/player-stats.response";
import { Player } from "src/player/player.schema";
import { playerKey } from "./helper";
import { RedisService } from "src/redis/redis.service";
import { PlayerStatsService } from "src/player-stats/player-stats.service";

async function getStatsOfPlayers(players: Player[], nets: Net[], redisService: RedisService, playerStatsService: PlayerStatsService): Promise<Record<string, CustomPlayerStats[]>> {
  // --- Precompute player->nets mapping ---
  const playerToNets: Record<string, Net[]> = {};
  for (const net of nets) {
    [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].filter(Boolean).forEach((pid) => {
      if (!playerToNets[pid]) playerToNets[pid] = [];
      playerToNets[pid].push(net);
    });
  }

  // --- Batch Redis queries for all players ---
  const allRedisKeys = players.flatMap((p) => (playerToNets[p._id] || []).map((net) => playerKey(p._id, net._id)));
  const redisResults = await Promise.all(allRedisKeys.map((key) => redisService.get(key)));
  const redisStats = (redisResults as CustomPlayerStats[]).filter(Boolean);

  // --- Organize Redis stats by playerId ---
  const redisByPlayer: Record<string, CustomPlayerStats[]> = {};
  for (const stat of redisStats) {
    if (!redisByPlayer[stat.player]) redisByPlayer[stat.player] = [];
    redisByPlayer[stat.player].push(stat);
  }

  // --- Collect missing stats from DB ---
  const missingStatsQueries: any[] = [];
  for (const player of players) {
    const netsOfPlayer = playerToNets[player._id] || [];
    const redisNetIds = new Set((redisByPlayer[player._id] || []).map((s) => s.net));
    const missingNetIds = netsOfPlayer.map((net) => String(net._id)).filter((id) => !redisNetIds.has(id));

    if (missingNetIds.length) {
      missingStatsQueries.push(playerStatsService.find({ player: player._id, net: { $in: missingNetIds } }));
    }
  }

  const dbStatsResults = await Promise.all(missingStatsQueries);

  // --- Normalize DB stats ---
  const statsOfPlayer: Record<string, CustomPlayerStats[]> = {};
  dbStatsResults.flat().forEach((ps) => {
    const plainObj = {...ps}
    const stat: CustomPlayerStats = {
      ...plainObj,
      net: String(plainObj.net),
      player: String(plainObj.player),
      match: String(plainObj.match),
    };
    if (!statsOfPlayer[stat.player]) statsOfPlayer[stat.player] = [];
    statsOfPlayer[stat.player].push(stat);
  });

  // --- Merge redis + db + fill empty nets ---
  for (const player of players) {
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
  }

  return statsOfPlayer;
}

export default getStatsOfPlayers;
