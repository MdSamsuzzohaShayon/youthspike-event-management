import { IEvent, IPlayer } from ".";

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  event: IEvent;
  players: IPlayer[];
  captain: IPlayer | null;
}

export interface ITeamAdd {
  active: boolean;
  name: string;
  event: string;
  players: string[];
  captain: string | null;
}
