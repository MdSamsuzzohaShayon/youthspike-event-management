import { INetPlayers } from '.';
import { ETieBreaker } from './net';
import { ETeam } from './team';

export enum EActionProcess {
  INITIATE = 'INITIATE',

  CHECKIN = 'CHECKIN',

  LINEUP = 'LINEUP',
  LINEUP_SUBMITTED = 'LINEUP_SUBMITTED',

  LOCKED = 'LOCKED',
  COMPLETE = 'COMPLETE',
}

export interface IRoomRoundProcess {
  _id: string;
  teamAProcess: null | EActionProcess;
  teamBProcess: null | EActionProcess;
}

export interface IRoom {
  _id: string;
  match: string;
  teamA: null | string;
  teamAClient: null | string;
  teamB: null | string;
  teamBClient: null | string;
  rounds: IRoomRoundProcess[];
}

export interface IRoomNets extends IRoom {
  nets: INetPlayers[];
  subbedRound: string;
  subbedPlayers: string[];
}

export interface ICheckIn {
  room: string;
  round: string;
  teamAProcess: string | null;
  teamBProcess: string | null;
}

export interface IRoomNetAssign {
  _id: string;
  teamAPlayerA: string | null | undefined;
  teamAPlayerB: string | null | undefined;
  teamBPlayerA: string | null | undefined;
  teamBPlayerB: string | null | undefined;
}

export interface IRoomNetType {
  _id: string;
  netType: ETieBreaker;
}

interface IActionCommon {
  room: string | null;
  round: string | null;
  teamAProcess: string | null;
  teamBProcess: string | null;
}
export interface ICheckInAction extends IActionCommon {
  nets: IRoomNetAssign[];
}

export interface ISubmitLineupAction extends ICheckInAction {
  teamAId: string;
  teamBId: string;
  match: string | null;
  subbedPlayers: string[];
  teamE: ETeam;
}

export interface ITeiBreakerAction extends IActionCommon {
  nets: IRoomNetType[];
}

export interface IMatchComplete {
  matchId: string;
}

export interface ISubmitLineup {
  room: string;
  round: string;
  teamAProcess: string | null;
  teamBProcess: string | null;
  nets: IRoomNetAssign[];
}
