import { IBadge, IEvent, IOption, IPlayer, ITeamRelatives, UserRole } from "@/types";
import { divisionsOfEvents, divisionsToOptionList } from "../helper";

/**
 * A player's password can only be changed by an admin/director, and only
 * for a player who currently captains or co-captains at least one team.
 */
export function canUpdatePassword(
    isUpdateMode: boolean,
    prevPlayer: IPlayer | null | undefined,
    currentUserRole: UserRole | undefined
): boolean {
    if (!isUpdateMode) return false;
    if (currentUserRole !== UserRole.admin && currentUserRole !== UserRole.director) return false;
    const captainOfTeams = prevPlayer?.captainofteams ?? [];
    const coCaptainOfTeams = prevPlayer?.cocaptainofteams ?? [];
    return captainOfTeams.length > 0 || coCaptainOfTeams.length > 0;
}




// ---------------------------------------------------------------------------
// Pure helpers — no React, no side effects, easy to unit test.
// ---------------------------------------------------------------------------

export function getFieldNameAndValue(event: React.SyntheticEvent): { fieldName: string; fieldValue: string } {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    return { fieldName: target.name, fieldValue: target.value };
}

/** Empty string becomes an empty selection, otherwise a single-item array. */
export function toSingleValueArray(value: string): string[] {
    return value ? [value] : [];
}

export function toSelectOptions<T>(
    items: T[],
    getValue: (item: T) => string,
    getLabel: (item: T) => string
): IOption[] {
    return items.map((item, index) => ({ id: index + 1, value: getValue(item), text: getLabel(item) }));
}

function getSelectedEventIdSet(selectedEventIds: string[] | undefined): Set<string> {
    return new Set(selectedEventIds ?? []);
}

export function buildDivisionOptions(
    allEvents: IEvent[] | undefined,
    selectedEventIds: string[] | undefined
): IOption[] {
    const selectedIds = getSelectedEventIdSet(selectedEventIds);
    const selectedEvents = (allEvents ?? []).filter((event) => selectedIds.has(event._id));
    return divisionsToOptionList(divisionsOfEvents(selectedEvents));
}

export function buildTeamOptions(
    allTeams: ITeamRelatives[],
    selectedEventIds: string[] | undefined
): IOption[] {
    if (!selectedEventIds || selectedEventIds.length === 0) return [];
    const selectedIds = getSelectedEventIdSet(selectedEventIds);
    // `.some()` short-circuits on the first match instead of scanning every
    // event on every team (the original loop kept iterating after a match).
    const matchingTeams = allTeams.filter((team) => team.events?.some((eventId) => selectedIds.has(eventId)));
    return toSelectOptions(matchingTeams, (team) => team._id, (team) => team.name);
}

export function buildBadgeOptions(
    allBadges: IBadge[],
    selectedEventIds: string[] | undefined
): IOption[] {
    if (!selectedEventIds || selectedEventIds.length === 0) return [];
    const selectedIds = getSelectedEventIdSet(selectedEventIds);
    // `.some()` short-circuits on the first match instead of scanning every
    // event on every team (the original loop kept iterating after a match).
    // const matchingBadges = allBadges.filter((team) => team.event?.some((eventId) => selectedIds.has(eventId)));
    const matchingBadges = allBadges.filter((team) => selectedIds.has(team.event));
    return toSelectOptions(matchingBadges, (badge) => badge._id, (badge) => badge.name);
}
