import { IMatch, IPlayer, IResponse, ITeam } from ".";
import { IDocument } from "./document";

interface IPlayerRankingCommon extends IDocument{
  rankLock: boolean | number;
}

interface IPlayerRankingItemCommon extends IDocument{
  rank: number;
}

export interface IPlayerRankingItem extends IPlayerRankingCommon{
  player: string;
  playerRanking: string;
}


export interface IPlayerRanking extends IPlayerRankingCommon{
  rankings: string[];

  // Make relationship with team(not nullable) and matc
  team: string;
  match?: string;
}


export interface IPlayerRankingItemExpRel extends IPlayerRankingItemCommon{
  player: IPlayer;
  playerRanking: IPlayerRankingExpRel;
}


export interface IPlayerRankingExpRel extends IPlayerRankingCommon{
  rankings: IPlayerRankingItemExpRel[];

  // Make relationship with team(not nullable) and matc
  team: ITeam;
  match?: IMatch;
}


export interface IPlayerWithRank {
  player: string;
  rank: number;
}

export interface IUpdatePlayerRankingRes extends IResponse{
  data?: {
    _id: string;
    rankLock: boolean;
  }
}