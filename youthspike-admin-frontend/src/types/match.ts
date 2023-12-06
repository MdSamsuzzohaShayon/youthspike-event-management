import { ITeam } from ".";

export interface IAddMatch {
  date: Date;
  event: string;
  location: string;
  netRange: number;
  numberOfNets: number;
  numberOfRounds: number;
  pairLimit: number;
  teamA: string;
  teamB: string;
}

export interface IMatch {
  _id: string;
  date: string; // ISO String
  event: string;
  location: string;
  netRange: number;
  numberOfNets: number;
  numberOfRounds: number;
  pairLimit: number;
  teamA: ITeam;
  teamB: ITeam;
}
