import { IDocument } from './document';
// import { IRound } from "./round";
import { IUser } from './user';

export interface INet extends IDocument {
  locked: boolean;
  lockedB: boolean;
  num: number;
  pairRange: number;
  roundId: string;
  points: number;
  teamAPlayerA?: IUser;
  teamAPlayerAId?: string;
  teamAPlayerB?: IUser;
  teamAPlayerBId?: string;
  teamBPlayerA?: IUser;
  teamBPlayerAId?: string;
  teamBPlayerB?: IUser;
  teamBPlayerBId?: string;
  teamAScore: number;
  teamBScore: number;
  // round?: IRound;
  timestamp: number;
}

export interface INetTeamPlayer {
  playerAId: string | null | undefined;
  playerBId: string | null | undefined;
}

export interface INetTeam {
  roundId: string;
  netId: string;
  teamA: INetTeamPlayer;
  teamB: INetTeamPlayer;
}
