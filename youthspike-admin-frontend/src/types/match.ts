import { IGroup, INetRelatives, IRoundRelatives, ITeam } from ".";

export interface ICommonMatchEvent{
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  description: string;
  location: string;
  fwango?: string | null;
}

export interface IDefaultMatch extends ICommonMatchEvent{
  division: string;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}


interface IMatchBase extends Partial<IDefaultMatchProps>{
  date: string;
  event: string;
}

export interface IAddMatch extends IDefaultMatch{
  date: string;
  event: string;
  teamA: string;
  teamB: string;
  numberOfNets: number;
  numberOfRounds: number;
  group?: string;
}

export interface IMatch extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
}

export interface IMatchRelatives extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundRelatives[];
  group?: string;
}

export interface IMatchExpRel extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  group?: IGroup;
}
