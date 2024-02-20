import { IEvent, IPlayer } from ".";

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  division: string;
  event: IEvent;
  players: IPlayer[];
  captain: IPlayer | null;
  cocaptain: IPlayer | null;
}

export interface ITeamAdd {
  active: boolean;
  name: string;
  event: string;
  players: string[];
  captain: string | null;
  cocaptain?: string | null;
}

export enum ETeam{
  teamA = 'teamA',
  teamB = 'teamB',
}
