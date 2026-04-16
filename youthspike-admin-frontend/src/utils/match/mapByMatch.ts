import { IRoundRelatives, INetRelatives } from "@/types";

/**
 * Groups an array of rounds by their match ID.
 * @param rounds - Array of round objects.
 * @returns A Map where the key is the match ID and the value is an array of rounds.
 */
export function createRoundMapByMatch(rounds: IRoundRelatives[]): Map<string, IRoundRelatives[]> {
  const map = new Map<string, IRoundRelatives[]>();
  for (const round of rounds) {
    const existing = map.get(round.match);
    if (existing) {
      existing.push(round);
    } else {
      map.set(round.match, [round]);
    }
  }
  return map;
}

/**
 * Groups an array of nets by their match ID.
 * @param nets - Array of net objects.
 * @returns A Map where the key is the match ID and the value is an array of nets.
 */
export function createNetMapByMatch(nets: INetRelatives[]): Map<string, INetRelatives[]> {
  const map = new Map<string, INetRelatives[]>();
  for (const net of nets) {
    const existing = map.get(net.match);
    if (existing) {
      existing.push(net);
    } else {
      map.set(net.match, [net]);
    }
  }
  return map;
}



/**
 * Groups an array of nets by their round ID.
 * @param nets - Array of net objects.
 * @returns A Map where the key is the round ID and the value is an array of nets.
 */
export function createNetMapByRound(nets: INetRelatives[]): Map<string, INetRelatives[]> {
  const map = new Map<string, INetRelatives[]>();
  for (const net of nets) {
    const existing = map.get(net.round);
    if (existing) {
      existing.push(net);
    } else {
      map.set(net.round, [net]);
    }
  }
  return map;
}

