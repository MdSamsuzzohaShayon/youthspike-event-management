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
  rank?: string | null;
  event?: string;
  team?: string;
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  profile: string | null;
  email: string;
  rank: number | null;
  status: EPlayerStatus,
  event?: string;
  team?: string;
  captainofteam: {
    _id: string;
    name: string;
  } | null;
}
