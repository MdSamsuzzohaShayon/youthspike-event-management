import { IDocument } from './document';
import { IMatch, IMatchRelatives } from './match';
import { INetRelatives } from './net';
import { IPlayer } from './player';
import { ITeam } from './team';

interface IProStatsCommon {
  servingPercentage: number; // serving %
  acePercentage: number; // Ace %
  receivingPercentage: number; // Receiving %
  hittingPercentage: number; // Hiting %
  settingPercentage: number; // Setting %
  defensiveConversionPercentage: number; // DC%
}

export interface IProStats extends IProStatsCommon {
  _id: string;
  event: string;
}

export interface IProStatsAdd extends IProStatsCommon {
  servingPercentage: number; // serving %
  acePercentage: number; // Ace %
  receivingPercentage: number; // Receiving %
  hittingPercentage: number; // Hiting %
  settingPercentage: number; // Setting %
  defensiveConversionPercentage: number; // DC%
}

interface IPlayerCommonStats {
  serveOpportunity: number;
  serveAce: number;
  serveCompletionCount: number;
  servingAceNoTouch: number;
  receiverOpportunity: number;
  receivedCount: number;
  noTouchAcedCount: number;
  settingOpportunity: number;
  cleanSets: number;
  hittingOpportunity: number;
  cleanHits: number;
  defensiveOpportunity: number;
  defensiveConversion: number;
  break: number;
  broken: number;
  matchPlayed: number;
}

export interface IPlayerStats extends IPlayerCommonStats {
  // Relationship
  match: string | IMatchRelatives;
  net: string | INetRelatives;
  player: string | IPlayer;
}

export interface IAggregatedStats {
  serveOpportunity: number;
  serveAce: number;
  serveCompletionCount: number;
  servingAceNoTouch: number;
  receiverOpportunity: number;
  receivedCount: number;
  noTouchAcedCount: number;
  settingOpportunity: number;
  cleanSets: number;
  hittingOpportunity: number;
  cleanHits: number;
  defensiveOpportunity: number;
  defensiveConversion: number;
  break: number;
  broken: number;
  matchPlayed: number;
}

interface IProStatsCommon {
  servingPercentage: number; // serving %
  acePercentage: number; // Ace %
  receivingPercentage: number; // Receiving %
  hittingPercentage: number; // Hiting %
  settingPercentage: number; // Setting %
  defensiveConversionPercentage: number; // DC%
}

export interface IProStats extends IProStatsCommon {
  _id: string;
  event: string;
}

export interface IGetPlayerStats {
  player: IPlayer;
  team: ITeam;
  playerstats: IPlayerStats[];
  matches: IMatch[];
  nets: INetRelatives[];
  multiplayer: IProStats;
  weight: IProStats;
  stats: IProStats;
}

export enum EPlayerStatType {
  Player = 'player',
  ServePercentage = 'servePercentage',
  PlusMinus = 'plusMinus',
  AcePercentage = 'acePercentage',
  ReceivePercentage = 'receivePercentage',
  HittingPercentage = 'hittingPercentage',
  SetAssistsPercentage = 'setAssistsPercentage',
  DefensePercentage = 'defensePercentage',
  WinPercentage = 'winPercentage',
}

// Keys (To make url clean)
export enum EStatsFilter {
  MATCH = 'm', // Match
  GAME = 'g', // game
  TEAMMATE = 'tm', // teammate
  CLUB = 'cb', 
  VS_PLAYER = 'vp', 
  CONFERENCE = 'ce', 
  START_DATE = 'sd',
  END_DATE = 'ed',
}


export enum EGroupType{
  OVERALL = "OVERALL",
  CONFERENCE = "CONFERENCE",
  NON_CONFERENCE = "NON_CONFERENCE",
}