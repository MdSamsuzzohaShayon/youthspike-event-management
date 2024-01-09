import { ITeam } from ".";

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
  event: string;
}

export interface IAddMatch extends IMatchBase{
  teamA: string;
  teamB: string;
}

export interface IMatch extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
}
