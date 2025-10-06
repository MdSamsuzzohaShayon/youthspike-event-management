import { MutationFunction } from '@apollo/client';
import {
  ICommonQuery,
  IError,
  IEvent,
  IGroupRelatives,
  IMatchExpRel,
  IMatchRelatives,
  INetRelatives,
  IPlayer,
  IPlayerExpRel,
  IPlayerRanking,
  IPlayerRankingExpRel,
  IPlayerRankingItem,
  IPlayerStats,
  IRoundRelatives,
} from '.';

export interface ITeam {
  _id: string;
  active: boolean;
  name: string;
  logo?: string | null;
  rankLock: boolean;
  division: string;
  sendCredentials: false;
  num: number;
  event: IEvent;
  players: IPlayerExpRel[];
  captain: IPlayerExpRel | null;
  cocaptain: IPlayerExpRel | null;
  nets: INetRelatives[];
  playerRanking: IPlayerRankingExpRel;
  group?: IGroupRelatives;
}

export interface ITeamAdd {
  active: boolean;
  name: string;
  logo?: string | null;
  event: string;
  division: string;
  players: string[];
  captain?: string | null;
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

export interface IGetTeamDetailQuery extends ICommonQuery {
  data: {
    team: ITeam;
    playerRanking: IPlayerRanking;
    players: IPlayer[];
    group: IGroupRelatives;
    captain?: IPlayer;
    cocaptain?: IPlayer;
    event: IEvent;
    matches: IMatchExpRel[];
    rankings: IPlayerRankingItem[];
    rounds: IRoundRelatives[];
    nets: INetRelatives[];
    teams: ITeam[];
    statsOfPlayer: IPlayerStats[];
  };
}

export interface IBaseTeamAction {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogo: React.RefObject<null | Blob | MediaSource>;
  playerIdList: string[];
  mutateTeam: MutationFunction;
  addTeam: MutationFunction;
  setAvailablePlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
  setPlayerIdList: React.Dispatch<React.SetStateAction<string[]>>;
  teamAddCB?: (teamData: ITeam) => void;
}

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}
