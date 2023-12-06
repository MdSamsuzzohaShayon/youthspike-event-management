import { IDocument } from "./document";
import { IUser } from "./user";

export interface ISub extends IDocument {
  roundId: string;
  players: string[];
  playerObjects?: IUser[];
}
