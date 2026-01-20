import { IAggregatedStats, IDefaultEventMatch, IDefaultMatchProps, IMenuItem, INetRelatives, IOption, IPlayerExpRel, IPlayerRank, IPlayerRankingItemExpRel, IPlayerStats, IRoundRelatives, ITeam, IUserContext } from "@/types";
import { eventPaths, initialUserMenuList } from "./staticData";
import { UserRole } from "@/types/user";
import { ETeam } from "@/types/team";

export function isValidObjectId(docId: string | null): boolean | null {
  if (!docId) return null;

  // Pattern to match a valid ObjectId
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;

  // Check if the provided string matches the pattern
  return objectIdPattern.test(docId);
}




export const divisionsToOptionList = (divisions: string) => {
  const divs: IOption[] = [];
  if (divisions && divisions.trim() !== '') {
    const dl = divisions.split(',');
    for (let i = 0; i < dl.length; i++) {
      const div = dl[i].trim();
      if (div !== "") {
        divs.push({ id: i + 1, text: div, value: div.toLowerCase() });
      }
    }
  }

  // ✅ Sort alphabetically by text (case-insensitive)
  return divs.sort((a, b) =>
    (a.text ?? "").localeCompare(b.text ?? "", undefined, { sensitivity: "base" })
  );
};


export const ISOToReadableDate = (isoString: string) => {
  const dateObj = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
  return formattedDate;
}


export const clickedInside = (e: Event, targetElement: HTMLElement): boolean => {
  const withinBoundaries = e.composedPath().includes(targetElement)
  return withinBoundaries;
}

export function randomKey() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // Adjust the range as needed
  const key = `${timestamp}-${randomNum}`;
  return key;
}


export function getEventIdFromPath(pathname: string) {
  const pathList = pathname.split('/');
  let eventPath = pathList.length > 0 ? pathList[1] : null;
  if (!isValidObjectId(eventPath)) return null;
  let isValidId = eventPath ? isValidObjectId(eventPath) : false;
  if (eventPath && eventPaths.includes(eventPath)) isValidId = false;
  return eventPath;
}

export function rearrangeMenu(userDetail: IUserContext, eventPath: string | null) {
  let menuList: IMenuItem[] = [];
  if (!eventPath) {
    if (userDetail.info?.role === UserRole.admin) {
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id === 6 || menuItem.id === 7)]; // Admin and directors
    } else if (userDetail.info?.role === UserRole.captain || userDetail.info?.role === UserRole.co_captain) {
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id === 3 || menuItem.id === 4)]; // captain
    } else {
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id === 5)]; // 5 = account
    }
  } else {
    if (userDetail.info?.role === UserRole.director) {
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id !== 6 && menuItem.id !== 7 && menuItem.id !== 9)]; // 2 = teams // 4 = matches
    } else if (userDetail.info?.role === UserRole.captain || userDetail.info?.role === UserRole.co_captain) {
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id === 3 || menuItem.id === 4 || menuItem.id === 1)]; // captain
    } else {
      menuList = initialUserMenuList;
    }
  }
  return menuList;
}


export function calcRoundScore(findNets: INetRelatives[], teamE: ETeam): number {
  // Remove the teamE declaration here
  let score = 0;

  findNets.forEach((net) => {
    const teamAScore = net?.teamAScore || 0;
    const teamBScore = net?.teamBScore || 0;

    // Dark is oponent team
    if (teamE === ETeam.teamA && teamAScore > teamBScore) {
      score += net.points;
    } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
      score += net.points;
    }
  });

  return score;
}


export const getRankedPlayers = (pl: IPlayerExpRel[] /** pl = Player List */, rankings?: IPlayerRankingItemExpRel[] /** pr = Player Ranking */): IPlayerRank[] => {
  if(!rankings) return pl;
  const rankingMap = new Map(pl.map((p) => [p._id, p]));
  const npl = rankings
    .filter((r) => rankingMap.has(r.player._id))
    .map((r) => ({ ...rankingMap.get(r.player._id)!, rank: r.rank })); // npl = new player list
  return npl
}


// Helper to check if a string is a valid MongoDB ObjectId
export const isMongoId=(pathname: string) =>{
  // ObjectId is 24 hex characters
  const objectIdRegex = /^\/[a-f\d]{24}$/i;
  return objectIdRegex.test(pathname);
}


export const aggregatePlayerStats = (stats: IPlayerStats[]): IAggregatedStats => {
  // Initialize all fields to 0
  const aggregated: IAggregatedStats = {
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
  };

  

  // Just sum all the numeric fields from each stat object
  stats.forEach((stat: IPlayerStats) => {
    aggregated.serveOpportunity += stat.serveOpportunity || 0;
    aggregated.serveAce += stat.serveAce || 0;
    aggregated.serveCompletionCount += stat.serveCompletionCount || 0;
    aggregated.servingAceNoTouch += stat.servingAceNoTouch || 0;
    aggregated.receiverOpportunity += stat.receiverOpportunity || 0;
    aggregated.receivedCount += stat.receivedCount || 0;
    aggregated.noTouchAcedCount += stat.noTouchAcedCount || 0;
    aggregated.settingOpportunity += stat.settingOpportunity || 0;
    aggregated.cleanSets += stat.cleanSets || 0;
    aggregated.hittingOpportunity += stat.hittingOpportunity || 0;
    aggregated.cleanHits += stat.cleanHits || 0;
    aggregated.defensiveOpportunity += stat.defensiveOpportunity || 0;
    aggregated.defensiveConversion += stat.defensiveConversion || 0;
    aggregated.break += stat.break || 0;
    aggregated.broken += stat.broken || 0;
    aggregated.matchPlayed += stat.matchPlayed || 0;
  });

  return aggregated;
};


/**
 * Filters items by division (case-insensitive).
 */
export function filterByDivision<T extends { division: string }>(
  items: T[],
  division: string
): T[] {
  const normalizedDivision = division.toLowerCase();
  return items.filter(
    (item) => item.division.toLowerCase() === normalizedDivision
  );
}

export function updateItemByIdMutable<T extends { _id: string }>(
  items: T[],
  updatedItem: Partial<T> & { _id: string }
): T[] {
  const index = items.findIndex(
    (item) => item._id === updatedItem._id
  );

  if (index === -1) return items;

  items[index] = { ...items[index], ...updatedItem };
  return items;
}

