/* eslint-disable import/no-cycle */
import { IPlayer } from './player';
import { IAllStats, IEvent, IEventWMatch } from './event';
import { IPlayerRanking, IPlayerRankingItem, IPlayerRankingItemExpRel, IPlayerRankingExpRel } from './playerRanking';
import { IGroup, IGroupRelatives } from './group';
import { IMatch, IMatchExpRel, IMatchRelatives } from './match';
import { INetRelatives } from './net';
import { IRoundRelatives } from './round';
import { IResponse } from './elements';



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

export interface ITeamFilter {
  search: string;
  division: string;
  group: string;
  limit?: number;
  offset?: number;
}


interface ISearchTeamData {
  event: IEvent;
  groups: IGroup[];
  matches: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  teams: ITeam[];
}


export interface ISearchTeamResponse{
  code: number;
  success: boolean;
  message: string;
  data: ISearchTeamData;
}


interface ITeamStats {
  events: IEventWMatch[];
  matches: IMatchRelatives[];
  players: IPlayer[];
  team: ITeam;
  oponents: ITeam[];
  statsOfPlayers: IAllStats[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

export interface IGetPlayerStatsResponse extends IResponse{
  data: ITeamStats;
}

interface ITeamRoster {
  events: IEvent[];
  players: IPlayer[];
  groups: IGroupRelatives[];
  team: ITeam;
  rankings: IPlayerRankingItemExpRel[];
  playerRanking: IPlayerRankingExpRel;
}


export interface IGetTeamRosterResponse  extends IResponse{
  data: ITeamRoster;
}

interface ITeamMatches {
  events: IEvent[];
  team: ITeam;
  oponents: ITeam[];
  matches: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

export interface IGetTeamMatchesResponse{
  code: number;
  success: boolean;
  message: string;
  data: ITeamMatches;
}

// eslint-disable-next-line no-shadow
export enum ETeam {
  // eslint-disable-next-line no-unused-vars
  teamA = 'teamA',
  // eslint-disable-next-line no-unused-vars
  teamB = 'teamB',
}
