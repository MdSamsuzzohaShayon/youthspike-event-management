import { EActionProcess } from "./room";

export enum ETieBreaker {
  PREV_NET = 'PREV_NET',
  FINAL_ROUND_NET = 'FINAL_ROUND_NET',
  FINAL_ROUND_NET_LOCKED = 'FINAL_ROUND_NET_LOCKED',
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

interface INetScoreUpdate {
  _id: string;
  teamAScore: number;
  teamBScore: number;
  completed: boolean;
}

interface IUpdateScoreResponse {
  nets: INetScoreUpdate[];
  room: string;
  round: INetScoreUpdate;
  matchCompleted: boolean;
  teamAProcess: EActionProcess; // Oponent Team
  teamBProcess: EActionProcess; // My Team
}

interface INetPlayers {
  _id: string;
  teamAPlayerA: string;
  teamAPlayerB: string;
  teamBPlayerA: string;
  teamBPlayerB: string;
}

export enum ETeamPlayer {
  PLAYER_A = 'PLAYER_A',
  PLAYER_B = 'PLAYER_B',
}

export type { INetBase, INetRelatives, INetUpdate, INetPlayers, INetScoreUpdate, IUpdateScoreResponse };
