import { IDocument } from "./document";

export interface IPlayerAdd {
  firstName: string;
  lastName: string;
  email: string;
  rank?: number | null;
  event?: string;
  team?: string;
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  email: string;
  rank: number | null;
  event?: string;
  team?: string;
  captainofteam: {
    _id: string;
    name: string;
  } | null;
}
