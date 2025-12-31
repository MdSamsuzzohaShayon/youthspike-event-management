import { useMutation } from '@apollo/client/react';
import {
  IAllStats,
  IError,
  IEvent,
  IGroup,
  IGroupRelatives,
  IMatch,
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IPlayerExpRel,
  IPlayerRanking,
  IPlayerRankingExpRel,
  IPlayerRankingItem,
  IPlayerRankingItemExpRel,
  IPlayerStats,
  IResponse,
  IRoundRelatives,
  TMutationFunction,
} from '.';
import { ApolloCache } from '@apollo/client';

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

export interface IGetTeamDetailQuery extends IResponse {
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

interface ITeamRoster {
  event: IEvent;
  players: IPlayer[];
  team: ITeam;
  statsOfPlayer: IAllStats[];
  rankings: IPlayerRankingItemExpRel[];
  playerRanking: IPlayerRankingExpRel;
}

export interface IGetTeamRosterResponse {
  code: number;
  success: boolean;
  message: string;
  data: ITeamRoster;
}

interface IEventWithTeams {
  event: IEvent;
  teams: ITeam[];
  groups: IGroup[];
  players: IPlayer[];
}

export interface IGetEventWithTeamsQuery {
  code: number;
  message: string;
  success: boolean;
  data: IEventWithTeams;
}

export interface IBaseTeamAction {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogo: React.RefObject<null | Blob | MediaSource>;
  playerIdList: string[];
  mutateTeam: TUpdateTeamFunction;
  addTeam: TCreateTeamMutationFunction;
  setAvailablePlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
  setPlayerIdList: React.Dispatch<React.SetStateAction<string[]>>;
  teamAddCB?: (teamData: ITeam) => void;
}

export interface ITeamFilter {
  search: string;
  division: string;
  group: string;
  limit?: number;
  offset?: number;
}

interface ITeamMatches {
  event: IEvent;
  team: ITeam;
  teams: ITeam[];
  matches: IMatchExpRel[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

export interface IGetTeamMatchesResponse {
  code: number;
  success: boolean;
  message: string;
  data: ITeamMatches;
}

interface ISearchTeamData {
  event: IEvent;
  groups: IGroup[];
  matches: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  teams: ITeam[];
}

export interface ISearchTeamResponse extends IResponse {
  data: ISearchTeamData;
}

export interface IUpdateTeamRes extends IResponse {
  data?: ITeam;
}

export interface ITeamRes extends IUpdateTeamRes {}

export type TUpdateTeamFunction = useMutation.MutationFunction<
  {
    updateTeam: IUpdateTeamRes;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

export type TCreateTeamMutationFunction = useMutation.MutationFunction<
  {
    createTeam: ITeamRes;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

export enum ETeam {
  teamA = 'teamA',
  teamB = 'teamB',
}
