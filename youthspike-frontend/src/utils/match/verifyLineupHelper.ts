import { IPlayer } from "@/types";

export const createPlayerMap = (players: IPlayer[]): Map<string, IPlayer> => {
  const map = new Map<string, IPlayer>();
  for (const player of players) map.set(player._id, player);
  return map;
};

export const createRankingMap = (
  teamARankings: { player: IPlayer; rank: number }[] | undefined,
  teamBRankings: { player: IPlayer; rank: number }[] | undefined
): Map<string, number> => {
  const map = new Map<string, number>();
  teamARankings?.forEach((r) => map.set(r.player._id, r.rank));
  teamBRankings?.forEach((r) => map.set(r.player._id, r.rank));
  return map;
};