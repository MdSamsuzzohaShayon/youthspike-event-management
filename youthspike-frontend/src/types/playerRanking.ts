/* eslint-disable import/no-cycle */
import { IMatchRelatives } from './match';
import { IDocument } from './document';
import { ITeam } from './team';
import { IPlayer } from './player';

interface IPlayerRankingCommon extends IDocument {
  rankLock: boolean;
}

interface IPlayerRankingItemCommon extends IDocument {
  rank: number;
}

export interface IPlayerRankingItem extends IPlayerRankingCommon {
  player: string;
  playerRanking: string;
}

export interface IPlayerRanking extends IPlayerRankingCommon {
  rankings: string[];

  // Make relationship with team(not nullable) and matc
  team: string;
  match?: string;
}

export interface IPlayerRankingItemExpRel extends IPlayerRankingItemCommon {
  player: IPlayer;
  // eslint-disable-next-line no-use-before-define
  playerRanking: IPlayerRankingExpRel;
}

export interface IPlayerRankingExpRel extends IPlayerRankingCommon {
  rankings: IPlayerRankingItemExpRel[];

  // Make relationship with team(not nullable) and matc
  team: ITeam;
  match?: IMatchRelatives;
}
