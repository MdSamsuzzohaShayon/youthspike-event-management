import { ITeam } from "./team";
import { IDocument } from "./document";
import { IAllStats, IEvent, IGroup, IMatch } from ".";

/**
 * Player Status
 */
export enum EPlayerStatus {
  "ACTIVE" = "ACTIVE",
  "INACTIVE" = "INACTIVE",
}


export interface IPlayerAdd {
  firstName: string;
  lastName: string;
  email: string;
  division: string;
  event?: string;
  team?: string;
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  username?: string;
  profile: string | null;
  email: string;
  division: string;
  status: EPlayerStatus,
  event?: string;
  teams?: ITeam[] | string[];
  captainofteams: ITeam[];
  cocaptainofteams: ITeam[];
}

export interface IPlayerRank extends IPlayer {
  rank: number;
}

export interface IPlayerRecord extends IPlayer{
  numOfGame: number;
  running: number;
  wins: number; // Number of games wins
  losses: number; // Number of games loses
  averagePointsDiff: number; // Points of wins os loses by how many points in each game on average
  rank?: number | null;
}


interface ISearchPlayerData {
  event: IEvent;
  groups: IGroup[];
  players: IPlayer[];
  teams: ITeam[];
  statsOfPlayer: IAllStats[];
  matches: IMatch[];
}

export interface ISearchPlayerResponse {
  code: number;
  success: boolean;
  message: string;
  data: ISearchPlayerData;
}
