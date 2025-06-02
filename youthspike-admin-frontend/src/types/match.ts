import { IGroup, IGroupRelatives, INetRelatives, IRoundRelatives, ITeam } from ".";
import { ETieBreakingStrategy } from "./event";

export interface ICommonMatchEvent{
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  description: string;
  location: string;
  accessCode?: string;
  tieBreaking: ETieBreakingStrategy;
  fwango?: string | null;
}

export interface IDefaultMatch extends ICommonMatchEvent{
  division: string;
  extendedOvertime?: boolean;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}


interface IMatchBase extends Partial<IDefaultMatchProps>{
  date: string;
  event: string;
  completed: boolean;
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
  group?: IGroupRelatives;
  nets: INetRelatives[];
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
