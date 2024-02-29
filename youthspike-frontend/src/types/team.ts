import { IEvent, IPlayer } from ".";

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  logo?: string | null;
  division: string;
  event: IEvent;
  players: IPlayer[];
  captain: IPlayer | null;
  cocaptain: IPlayer | null;
}


export enum ETeam{
  teamA = 'teamA',
  teamB = 'teamB',
}
