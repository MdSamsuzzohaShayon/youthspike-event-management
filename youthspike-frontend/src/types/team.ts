/* eslint-disable import/no-cycle */
import { IPlayer } from './player';
import { IEvent } from './event';
import { IPlayerRanking } from './playerRanking';
import { IGroup } from './group';
import { IMatchExpRel } from './match';



export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  logo?: string | null;
  division: string;
  group: IGroup;
  event: IEvent;
  matches: IMatchExpRel[];
  players: IPlayer[];
  moved?: IPlayer[];
  captain: IPlayer | null;
  cocaptain: IPlayer | null;
  playerRanking: IPlayerRanking;
}


export interface ITeamScore {
  rank: number;
  totalMatches: number;
  overallWins: number;
  overallLoses: number;
  groupWins: number;
  groupLoses: number;
  matchAvgDiff: number;
  gameAvgDiff: number;
}

// eslint-disable-next-line no-shadow
export enum ETeam {
  // eslint-disable-next-line no-unused-vars
  teamA = 'teamA',
  // eslint-disable-next-line no-unused-vars
  teamB = 'teamB',
}
