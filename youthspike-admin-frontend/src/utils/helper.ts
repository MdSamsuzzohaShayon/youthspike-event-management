import { IDefaultEventMatch, IDefaultMatchProps, IMenuItem, INetRelatives, IOption, IRoundRelatives, ITeam, IUserContext } from "@/types";
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
      if (dl[i].trim() !== "") {
        divs.push({ text: dl[i].trim(), value: dl[i].trim().toLowerCase() });
      }
    }
  }
  return divs;
}

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
      menuList = [...initialUserMenuList.filter((menuItem) => menuItem.id === 3 || menuItem.id === 4 || menuItem.id === 1 || menuItem.id === 9)]; // captain
    } else {
      menuList = initialUserMenuList;
    }
  }
  return menuList;
}


export function calcRoundScore(findNets: INetRelatives[], round: IRoundRelatives, teamE: ETeam): number {
  // Remove the teamE declaration here
  let score = 0;

  findNets.forEach((net) => {
      const teamAScore = net.teamAScore || 0;
      const teamBScore = net.teamBScore || 0;

      // Dark is oponent team
      if (teamE === ETeam.teamA && teamAScore > teamBScore) {
          score += net.points;
      } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
          score += net.points;
      }
  });
  

  const fullPoints = teamE === ETeam.teamA ? round.teamAScore || 0 : round.teamBScore || 0;

  return score;
}
