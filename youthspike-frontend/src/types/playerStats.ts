import { IMatch, IMatchRelatives } from "./match";
import { INetRelatives } from "./net";
import { IPlayer } from "./player";
import { IRoundRelatives } from "./round";
import { ITeam } from "./team";

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
  players: IPlayer[];
  team: ITeam;
  oponents: ITeam[];
  playerstats: IPlayerStats[];
  matches: IMatch[];
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  multiplayer: IProStats;
  weight: IProStats;
  stats: IProStats;
}

// Keys (To make url clean)
export enum EStatsFilter {
  MATCH = 'm', // Match
  GAME = 'g', // game
  TEAMMATE = 'tm', // teammate
  CLUB = 'cb', // teammate
  VS_PLAYER = 'vp', // teammate
  CONFERENCE = 'ce', // teammate
  START_DATE = 'sd',
  END_DATE = 'ed',
}


export interface IFilter {
  startDate: string;
  endDate: string;
  match: string[];
  game: string[];
  conference?: string;
  teammate?: string[];
  club?: string[];
  vsPlayer?: string[];
}


export enum EPlayerStatType {
  Player = "player",
  ServePercentage = "servePercentage",
  PlusMinus = "plusMinus",
  AcePercentage = "acePercentage",
  ReceivePercentage = "receivePercentage",
  HittingPercentage = "hittingPercentage",
  SetAssistsPercentage = "setAssistsPercentage",
  DefensePercentage = "defensePercentage",
  WinPercentage = "winPercentage",
}


export interface IStatsFilterProps {
  player: IPlayer;
  players: IPlayer[];
  filter: Partial<Record<EStatsFilter, string | string[]>>;
  /**
   * Improved type for handler:
   * key must be a key of IFilter and value must be the correct type for that key.
   */
  handleInputChange: <K extends keyof IFilter>(key: K, value: IFilter[K]) => void;
  matches: IMatch[];
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  teams: ITeam[];
}


