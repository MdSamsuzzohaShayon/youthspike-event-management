import { IEvent, IRoundExpRel, ITeam } from ".";

export interface IDefaultMatch{
  divisions: string;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  coachPassword: string;
  location: string;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}


interface IMatchBase extends Partial<IDefaultMatchProps>{
  date: string;
}

export interface IAddMatch extends IMatchBase{
  teamA: string;
  teamB: string;
}


export interface IMatchRelatives extends IMatchBase{
  _id: string;
  event: string;
  teamA: string;
  teamB: string;
  rounds: string[];
}

export interface IMatchExpRel extends IMatchBase{
  _id: string;
  event: IEvent;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundExpRel[];
}
