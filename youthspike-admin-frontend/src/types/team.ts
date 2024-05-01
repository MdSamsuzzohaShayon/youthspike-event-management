import { IEvent, INetRelatives, IPlayer, IPlayerExpRel } from ".";

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  logo?: string | null;
  rankLock: boolean;
  division: string;
  sendCredentials: false;
  num: number;
  event: IEvent;
  players: IPlayerExpRel[];
  captain: IPlayerExpRel | null;
  nets: INetRelatives[];
}



export interface ITeamAdd {
  active: boolean;
  name: string;
  logo?: string | null;
  event: string;
  division: string;
  players: string[];
  captain?: string | null;
}

export enum ETeam{
  teamA = "teamA",
  teamB = "teamB",
}
