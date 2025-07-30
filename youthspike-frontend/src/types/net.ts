// eslint-disable-next-line import/no-cycle
import { EActionProcess } from './room';

// eslint-disable-next-line no-shadow
export enum ETieBreaker {
  // eslint-disable-next-line no-unused-vars
  PREV_NET = 'PREV_NET',
  // eslint-disable-next-line no-unused-vars
  FINAL_ROUND_NET = 'FINAL_ROUND_NET',
  // eslint-disable-next-line no-unused-vars
  FINAL_ROUND_NET_LOCKED = 'FINAL_ROUND_NET_LOCKED',
  // eslint-disable-next-line no-unused-vars
  TIE_BREAKER_NET = 'TIE_BREAKER_NET',
}

interface INetBase {
  _id: string;
  num: number;
  points: number;
  netType: ETieBreaker;
  teamAScore: number | null;
  teamBScore: number | null;
  pairRange?: number;
}

interface INetRelatives extends INetBase {
  // match: string | Match;
  round: string;
  teamA?: string | null;
  teamB?: string | null;
  teamAPlayerA?: string | null;
  teamAPlayerB?: string | null;
  teamBPlayerA?: string | null;
  teamBPlayerB?: string | null;
  serverReceiverOnNet?: string;
  serverReceiverSinglePlay?: string[];
}

interface INetUpdate {
  _id: string;
  teamAPlayerA?: string | null;
  teamAPlayerB?: string | null;
  teamBPlayerA?: string | null;
  teamBPlayerB?: string | null;
  teamAScore?: number | null;
  teamBScore?: number | null;
}

interface ICommonNetRound{
  _id: string;
  teamAScore: number;
  teamBScore: number;
}

interface INetScoreUpdate extends ICommonNetRound{
}

interface IRoundScoreUpdate extends ICommonNetRound{
  completed: boolean;
}

interface IUpdateScoreResponse {
  nets: INetScoreUpdate[];
  room: string;
  round: IRoundScoreUpdate;
  matchCompleted: boolean;
  teamAProcess: EActionProcess; // Oponent Team
  teamBProcess: EActionProcess; // My Team
}

interface INetPlayers {
  _id: string;
  teamAPlayerA: string | null;
  teamAPlayerB: string | null;
  teamBPlayerA: string | null;
  teamBPlayerB: string | null;
}

// eslint-disable-next-line no-shadow
export enum ETeamPlayer {
  // eslint-disable-next-line no-unused-vars
  PLAYER_A = 'PLAYER_A',
  // eslint-disable-next-line no-unused-vars
  PLAYER_B = 'PLAYER_B',
}

export type { INetBase, INetRelatives, INetUpdate, INetPlayers, INetScoreUpdate, IUpdateScoreResponse };
