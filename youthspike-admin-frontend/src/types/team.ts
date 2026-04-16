import { useMutation } from '@apollo/client/react';
import {
  IAllStats,
  IEvent,
  IMessage,
  IEventExpRel,
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
  IMatchRelatives,
} from '.';
// @ts-ignore
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
  matches: IMatch[];
  players: IPlayerExpRel[];
  captain: IPlayerExpRel | null;
  cocaptain: IPlayerExpRel | null;
  nets: INetRelatives[];
  playerRanking: IPlayerRankingExpRel;
  groups?: IGroupRelatives[];
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


export interface IGetTeamsResponse extends IResponse {
  data: ITeam[];
}

interface ITeamRoster {
  events: IEvent[];
  players: IPlayer[];
  groups: IGroupRelatives[];
  team: ITeam;
  rankings: IPlayerRankingItemExpRel[];
  playerRanking: IPlayerRankingExpRel;
}

interface ITeamStats {
  events: IEventExpRel[];
  matches: IMatchRelatives[];
  players: IPlayer[];
  team: ITeam;
  oponents: ITeam[];
  statsOfPlayers: IAllStats[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

export interface IGetTeamRosterResponse  extends IResponse{
  data: ITeamRoster;
}

export interface IGetTeamStatsResponse  extends IResponse{
  data: ITeamStats;
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
  showMessage: (message: Omit<IMessage, "id">) => void;
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
  events: IEvent[];
  team: ITeam;
  oponents: ITeam[];
  matches: IMatchExpRel[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

export interface IGetTeamMatchesResponse extends IResponse{
  data: ITeamMatches;
}

interface ISearchTeamData {
  events: IEvent[];
  groups: IGroupRelatives[];
  matches: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  teams: ITeam[];
  captains: IPlayer[];
}

export interface ISearchTeamResponse extends IResponse {
  data: ISearchTeamData;
}

export interface IUpdateTeamRes extends IResponse {
  data?: ITeam;
}

export interface IGetTeamWithGroupsAndUnassignedPlayersResponse extends IResponse{
  data?: {
    team: ITeam;
    events: IEvent[];
    players: IPlayer[];
    groups: IGroup[];
  }
}

export interface IGetEventWithTeamsResponse extends IResponse{
  data: IEventExpRel;
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
