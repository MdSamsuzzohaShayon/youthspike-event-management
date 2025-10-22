import { IMatch, INetRelatives, ITeam } from "@/types";
import { readDate } from "../datetime";

/** Friendly label formatter for a match entry. */
export function formatMatchLabel(
  match: IMatch,
  teamA?: ITeam | null,
  teamB?: ITeam | null
): string {
  const dateText = readDate(match.date);
  const teamsText = teamA && teamB ? ` - ${teamA.name} VS ${teamB.name}` : "";
  return `${dateText}${teamsText} - ${match.description}`;
}

/** Small helper to check if a playerId participates in a net. */
export function isPlayerParticipatingInNet(
  net: INetRelatives,
  playerId: string
): boolean {
  return [
    net.teamAPlayerA,
    net.teamAPlayerB,
    net.teamBPlayerA,
    net.teamBPlayerB,
  ].includes(playerId);
}
