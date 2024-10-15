/* eslint-disable import/no-cycle */
import { IPlayer } from './player';
import { IEvent } from './event';
import { IPlayerRanking } from './playerRanking';

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
  playerRanking: IPlayerRanking;
}

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}
