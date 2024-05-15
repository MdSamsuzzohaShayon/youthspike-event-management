/* eslint-disable import/no-cycle */
import { IEvent } from './event';
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
}

export interface IMatchExpRel extends IMatchBase {
  _id: string;
  completed: boolean;
  event: IEvent;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundExpRel[];
  room: IRoom;
}
