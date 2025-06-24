/* eslint-disable no-shadow */
/* eslint-disable import/no-cycle */
import { ETieBreaker, INetPlayers } from './net';
import { IServerReceiverOnNet } from './socket';
import { ETeam } from './team';
import { UserRole } from './user';

export enum EActionProcess {
  // eslint-disable-next-line no-unused-vars
  INITIATE = 'INITIATE',

  // eslint-disable-next-line no-unused-vars
  CHECKIN = 'CHECKIN',

  // eslint-disable-next-line no-unused-vars
  LINEUP = 'LINEUP',
  // eslint-disable-next-line no-unused-vars
  LINEUP_SUBMITTED = 'LINEUP_SUBMITTED',

  // eslint-disable-next-line no-unused-vars
  LOCKED = 'LOCKED',
  // eslint-disable-next-line no-unused-vars
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
  match?: string;
  room: string | null;
  round: string | null;
  teamAProcess: EActionProcess | null;
  teamBProcess: EActionProcess | null;
}
export interface ICheckInAction extends IActionCommon {
  nets: IRoomNetAssign[];
}

export interface ISubmitLineupAction extends ICheckInAction {
  eventId: string;
  teamAId: string;
  teamBId: string;
  subbedPlayers: string[];
  teamE: ETeam;
  userRole: UserRole;
  userId?: string
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
