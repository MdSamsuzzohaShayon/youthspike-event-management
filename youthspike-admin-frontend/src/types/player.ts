import { IEvent, ITeam } from ".";
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
  username: string;
  email: string;
  phone?: string;
  division: string;
  rank?: string | null;
  event?: string;
  team?: string;
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  username: string;
  profile: string | null;
  phone?: string;
  division: string;
  email: string;
  rank: number | null;
  rankLock?: boolean;
  status: EPlayerStatus,
  events?: string[];
  teams?: string[];
  captainofteams: {
    _id: string;
    name: string;
  }[] | null;
  cocaptainofteams: {
    _id: string;
    name: string;
  }[] | null;
}

export interface IPlayerExpRel extends IDocument {
  firstName: string;
  lastName: string;
  profile: string | null;
  phone?: string;
  division: string;
  email?: string;
  username: string;
  rank: number | null;
  rankLock?: boolean;
  status: EPlayerStatus,
  events?: IEvent[];
  teams?: ITeam[];
  captainofteams: ITeam[] | null;
  cocaptainofteams: ITeam[] | null;
}
