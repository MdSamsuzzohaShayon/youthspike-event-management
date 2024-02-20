import { IDefaultEventMatch, IDefaultMatchProps, IOption, ITeam } from "@/types";

export function isValidObjectId(docId: string): boolean {
  // Pattern to match a valid ObjectId
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;

  // Check if the provided string matches the pattern
  return objectIdPattern.test(docId);
}


interface IEventMatchTeams extends IDefaultEventMatch {
  teams: ITeam[]; // add teams to IDefaultEventMatch
  numberOfNets: number;
  numberOfRounds: number;
}
interface IMatchTeams extends IDefaultMatchProps {
  teams: ITeam[]; // add teams to IDefaultEventMatch
}

export const toMatchDefaultData = (eData: IEventMatchTeams): IMatchTeams | null => {
  if (!eData) return null;
  const defaultProps = {
    divisions: eData.divisions,
    numberOfNets: eData.nets ? eData.nets : eData.numberOfNets, // Changes
    numberOfRounds: eData.rounds ? eData.rounds : eData.numberOfRounds, // Changes
    netVariance: eData.netVariance,
    homeTeam: eData.homeTeam,
    autoAssign: eData.autoAssign,
    autoAssignLogic: eData.autoAssignLogic,
    rosterLock: eData.rosterLock,
    timeout: eData.timeout,
    coachPassword: eData.coachPassword,
    location: eData.location,
    teams: eData.teams
  }
  return defaultProps;
}

export const divisionsToOptionList = (divisions: string) => {
  const divs: IOption[] = [];
  if (divisions && divisions.trim() !== '') {
    const dl = divisions.split(',');
    for (let i = 0; i < dl.length; i++) {
      if (dl[i].trim() !== "") {
        divs.push({ text: dl[i], value: dl[i].toLowerCase() });
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