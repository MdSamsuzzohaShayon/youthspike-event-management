import { IPlayerPage, IPlayerWithRank } from '@/types';
import { PLAYER_PAGE } from './constant';

// Division
function setDivisionToStore(division: string) {
  window.localStorage.setItem('division', division);
}

function getDivisionFromStore(): null | string {
  if (typeof window === 'undefined') return null;
  const division = window.localStorage.getItem('division');
  if (division?.trim() === 'undefined') {
    removeDivisionFromStore();
    return null;
  }
  if (division && division.trim() !== '') return division.trim().toLowerCase();
  return null;
}

function removeDivisionFromStore() {
  window.localStorage.removeItem('division');
}

// Team
function setTeamToStore(teamId: string) {
  window.localStorage.setItem('team', teamId);
}

function getTeamFromStore(): null | string {
  if (typeof window === 'undefined') return null;
  const teamId = window.localStorage.getItem('team');
  if (teamId && teamId.trim() !== '') return teamId;
  return null;
}

function removeTeamFromStore() {
  window.localStorage.removeItem('team');
}

// Player ranking
function setPlayerRankings(rankings: IPlayerWithRank[]) {
  window.localStorage.setItem('playerRankings', JSON.stringify(rankings));
}

function removePlayerRankings() {
  window.localStorage.removeItem('playerRankings');
}

function getPlayerRankings(): IPlayerWithRank[] | null {
  const playerRankings = window.localStorage.getItem('playerRankings');
  if (!playerRankings) return null;
  const jsonParsed = JSON.parse(playerRankings);
  return jsonParsed;
}

/**
 * Save player page for an event
 */
function setPlayerPage(eventId: string, page: number): void {
  const raw = localStorage.getItem(PLAYER_PAGE);
  let pages: Record<string, IPlayerPage> = raw ? JSON.parse(raw) : {};

  // Replace / insert in O(1) time
  pages[eventId] = {
    date: new Date().toISOString(),
    eventId,
    page,
  };

  localStorage.setItem(PLAYER_PAGE, JSON.stringify(pages));
}

/**
 * Get player page by eventId
 * - Removes entries older than 7 days
 */
function getPlayerPage(eventId: string): IPlayerPage | null {
  const raw = localStorage.getItem(PLAYER_PAGE);
  if (!raw) return null;

  let pages: Record<string, IPlayerPage> = JSON.parse(raw);

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  // Cleanup expired entries in place
  for (const [id, entry] of Object.entries(pages)) {
    const entryDate = new Date(entry.date).getTime();
    if (now - entryDate > sevenDays) {
      delete pages[id];
    }
  }

  // Save cleaned storage only if changes were made
  localStorage.setItem(PLAYER_PAGE, JSON.stringify(pages));

  return pages[eventId] ?? null;
}

export { setDivisionToStore, getDivisionFromStore, removeDivisionFromStore, setTeamToStore, getTeamFromStore, removeTeamFromStore, setPlayerRankings, removePlayerRankings, getPlayerRankings, setPlayerPage, getPlayerPage };
