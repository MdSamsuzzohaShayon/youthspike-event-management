import { IMatchRelatives } from './match';
import { INetRelatives } from './net';
import { IPlayer } from './player';

interface IPlayerCommonStats {
  serveOpportunity: number;
  serveAce: number;
  serveCompletionCount: number;
  servingAceNoTouch: number;
  receiverOpportunity: number;
  receivedCount: number;
  noTouchAcedCount: number;
  settingOpportunity: number;
  settingCompletion: number;
  hittingOpportunity: number;
  hittingCompletion: number;
  cleanHits: number;
  defensiveOpportunity: number;
  defensiveConversion: number;
  break: number;
  broken: number;
  matchPlayed: number;
}

export interface IPlayerTotalStats extends IPlayerCommonStats {}

export interface IPlayerStats extends IPlayerCommonStats {
  // Relationship
  match: string | IMatchRelatives;
  net: string | INetRelatives;
  player: string | IPlayer;
}
