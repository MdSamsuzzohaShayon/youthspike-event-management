import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import { EPlayerStatus, ETeam, INetRelatives, IPlayer, ITeam, IUserContext, UserRole } from "@/types";

/** Roles allowed to operate the round runner controls. */
export const ROUND_RUNNER_ROLES: UserRole[] = [
  UserRole.director,
  UserRole.admin,
  UserRole.captain,
  UserRole.co_captain,
];

/** Returns only players who are not marked inactive. */
export function filterActivePlayers(players: IPlayer[]): IPlayer[] {
  return players.filter((player) => player.status !== EPlayerStatus.INACTIVE);
}

/**
 * Builds a set of player ids that have already been moved between teams,
 * combining both teams' "moved" lists. A Set gives O(1) membership checks
 * per player instead of re-scanning the moved arrays, and only stores ids
 * rather than full player objects.
 */
export function getMovedPlayerIdSet(
  teamA: ITeam | null,
  teamB: ITeam | null
): Set<string> {
  const movedPlayers = [...(teamA?.moved ?? []), ...(teamB?.moved ?? [])];
  return new Set(movedPlayers.map((player) => player._id));
}

/** Removes any player whose id is present in the given "moved" id set. */
export function excludeMovedPlayers(
  players: IPlayer[],
  movedPlayerIds: Set<string>
): IPlayer[] {
  return players.filter((player) => !movedPlayerIds.has(player._id));
}

/** Returns the team opposing the given team. */
export function getOpponentTeamE(teamE: ETeam): ETeam {
  return teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
}


/**
 * Determines whether the current viewer may operate the round runner:
 * - Anyone who isn't a captain/co-captain (admins, directors, etc.) has access.
 * - A captain/co-captain only has access if they actually captain/co-captain
 *   one of the two teams playing in this match.
 */
export function canAccessRoundRunner(
  viewer: IUserContext | null | undefined,
  teamA: ITeam | null,
  teamB: ITeam | null
): boolean {
  const role = viewer?.info?.role;
  if (role !== UserRole.captain && role !== UserRole.co_captain) {
    return true;
  }

  const captainPlayerId = viewer?.info?.captainplayer;
  if (
    captainPlayerId &&
    (captainPlayerId === teamA?.captain?._id ||
      captainPlayerId === teamB?.captain?._id)
  ) {
    return true;
  }

  const coCaptainPlayerId = viewer?.info?.cocaptainplayer;
  if (
    coCaptainPlayerId &&
    (coCaptainPlayerId === teamA?.cocaptain?._id ||
      coCaptainPlayerId === teamB?.cocaptain?._id)
  ) {
    return true;
  }

  return false;
}

export function isAdminOrDirector(role: UserRole | undefined): boolean {
  return role === UserRole.admin || role === UserRole.director;
}

/**
 * Builds the "view roster" link for a team. Returns undefined when the team
 * id isn't known yet, so callers can skip rendering a broken link instead
 * of pointing at `/teams/undefined/roster/...`.
 */
export function getTeamRosterHref(
  teamId: string | undefined,
  ldoIdUrl: string,
  useAdminFrontend: boolean
): string | undefined {
  if (!teamId) return undefined;
  const basePath = useAdminFrontend ? `${ADMIN_FRONTEND_URL}/teams` : "/teams";
  return `${basePath}/${teamId}/roster/${ldoIdUrl}`;
}

/**
 * Converts a millisecond duration into an absolute end timestamp, given an
 * ISO start time and a timeout length in minutes. Returns null when either
 * input is invalid so callers can bail out instead of displaying "NaN:NaN".
 */
export function getRoundTimeoutEndMs(
  timerStartIso: string,
  timeoutMinutes: number
): number | null {
  const startMs = new Date(timerStartIso).getTime();
  const timeoutMs = timeoutMinutes * 60 * 1000;
  if (Number.isNaN(startMs) || Number.isNaN(timeoutMs)) return null;
  return startMs + timeoutMs;
}


/** Pure helpers — no component state, easy to unit test in isolation. */

export function isActivePlayer(player: IPlayer): boolean {
  return player.status === EPlayerStatus.ACTIVE;
}

/** Player ids already occupying a net slot this round. */
export function getAssignedPlayerIds(nets: INetRelatives[]): Set<string> {
  const assignedIds = new Set<string>();
  nets.forEach((net) => {
    const netPlayerIds = [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB];
    netPlayerIds.forEach((playerId) => {
      if (playerId) assignedIds.add(playerId);
    });
  });
  return assignedIds;
}

/**
 * Player ids moved off either roster. Only membership is ever checked
 * (`.has`), so a Set of ids is enough — no need to keep a Map of the
 * full player objects around just to answer a yes/no question.
 */
export function getMovedPlayerIds(teamA: ITeam | null | undefined, teamB: ITeam | null | undefined): Set<string> {
  const movedIds = new Set<string>();
  teamA?.moved?.forEach((player) => movedIds.add(player._id));
  teamB?.moved?.forEach((player) => movedIds.add(player._id));
  return movedIds;
}

export function getAvailableSubs(teamPlayers: IPlayer[], movedPlayerIds: Set<string>, assignedPlayerIds: Set<string>): IPlayer[] {
  return teamPlayers.filter(
    (player) => isActivePlayer(player) && !movedPlayerIds.has(player._id) && !assignedPlayerIds.has(player._id),
  );
}