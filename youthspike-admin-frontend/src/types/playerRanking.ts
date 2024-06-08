import { IMatch, IPlayer, ITeam } from ".";
import { IDocument } from "./document";

interface IPlayerRankingCommon extends IDocument{
  rankLock: boolean;
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
