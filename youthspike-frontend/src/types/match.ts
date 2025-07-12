/* eslint-disable import/no-cycle */
import { IEvent } from './event';
import { IGroup } from './group';
import { INetRelatives } from './net';
import { IPlayerRanking, IPlayerRankingExpRel } from './playerRanking';
import { IRoom } from './room';
import { IRoundExpRel } from './round';
import { IServerReceiverOnNetMixed } from './socket';
import { ITeam } from './team';

// eslint-disable-next-line no-shadow
export enum ETieBreakingStrategy {
  // eslint-disable-next-line no-unused-vars
  TWO_POINTS_NET = 'TWO_POINTS_NET',
  // eslint-disable-next-line no-unused-vars
  OVERTIME_ROUND = 'OVERTIME_ROUND',
}

export interface IDefaultMatch {
  division: string;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  coachPassword: string;
  description: string;
  location: string;
  tieBreaking: ETieBreakingStrategy;
  fwango?: string | null;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}

interface IMatchBase extends Partial<IDefaultMatchProps> {
  date: string;
  extendedOvertime?: boolean;
}

export interface IAddMatch extends IMatchBase {
  teamA: string;
  teamB: string;
}

export interface IMatchRelatives extends IMatchBase {
  _id: string;
  completed: boolean;
  event: string;
  teamA: string;
  teamB: string;
  rounds: string[];
  group?: string;
}

export interface IMatchExpRel extends IMatchBase {
  _id: string;
  completed: boolean;
  event: IEvent;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundExpRel[];
  nets: INetRelatives[];
  room: IRoom;
  group?: IGroup;

  teamARanking?: IPlayerRankingExpRel;
  teamBRanking?: IPlayerRankingExpRel;

  netsServerReceiver?: IServerReceiverOnNetMixed[];
}
