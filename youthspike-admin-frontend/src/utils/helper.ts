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

// {
//   "__typename": "Match",
//   "_id": "6574936dc132cfaf60297bd0",
//   "numberOfNets": 3,
//   "numberOfRounds": 2,
//   "location": "USA",
//   "netRange": 5,
//   "teamA": {
//       "__typename": "Team",
//       "_id": "6571e9e42c2699c67ee73cd2",
//       "name": "Team 2",
//       "captain": {
//           "__typename": "Player",
//           "_id": "6571e9772c2699c67ee73c8f",
//           "firstName": "Jared",
//           "lastName": "Gunn"
//       }
//   },
//   "teamB": {
//       "__typename": "Team",
//       "_id": "6571e9cb2c2699c67ee73cb8",
//       "name": "Team 1",
//       "captain": {
//           "__typename": "Player",
//           "_id": "6571e9772c2699c67ee73c8a",
//           "firstName": "Izayah",
//           "lastName": "Gibson"
//       }
//   }
// }