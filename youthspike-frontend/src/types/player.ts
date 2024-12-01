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
}

export interface IPlayerRecord {
  running: number;
  wins: number;
  losses: number;
}
