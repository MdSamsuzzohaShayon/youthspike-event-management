import { ITeam } from "./team";
import { IDocument } from "./document";

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
  profile: string | null;
  email: string;
  division: string;
  status: EPlayerStatus,
  event?: string;
  teams?: ITeam[];
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
