import { IEvent, INetRelatives, IPlayer } from ".";

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  event: IEvent;
  players: IPlayer[];
  captain: IPlayer | null;
  nets: INetRelatives[];
}

export interface ITeamAdd {
  active: boolean;
  name: string;
  event: string;
  players: string[];
  captain: string | null;
}
