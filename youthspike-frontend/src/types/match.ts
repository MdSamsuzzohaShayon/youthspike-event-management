/* eslint-disable import/no-cycle */
import { IEvent } from './event';
import { IGroup } from './group';
import { INetRelatives } from './net';
import { IRoom } from './room';
import { IRoundExpRel } from './round';
import { ITeam } from './team';

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
  fwango?: string | null;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}

interface IMatchBase extends Partial<IDefaultMatchProps> {
  date: string;
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
}
