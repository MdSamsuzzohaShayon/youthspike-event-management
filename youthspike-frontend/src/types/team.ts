/* eslint-disable import/no-cycle */
import { IPlayer } from './player';
import { IEvent } from './event';
import { IPlayerRanking } from './playerRanking';
import { IGroup } from './group';

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  logo?: string | null;
  division: string;
  group: IGroup;
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
