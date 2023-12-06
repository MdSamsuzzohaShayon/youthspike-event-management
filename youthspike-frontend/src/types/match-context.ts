import { IMatch } from "./match";

export interface IMatchInfo {
  _id: string;
  matchId: string;
  teamId: string;
  timeStamp: string;
}

export interface IMatchContext extends IMatch { }
