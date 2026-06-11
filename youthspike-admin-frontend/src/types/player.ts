import { useMutation } from "@apollo/client/react";
import { IAllStats, IEvent, IGroup, IMatch, IPlayerRanking, IPlayerRankingItem, IResponse, ITeam, ITeamRelatives } from ".";
import { IDocument } from "./document";
import { ApolloCache } from "@apollo/client";

/**
 * Player Status
 */
export enum EPlayerStatus {
  "ACTIVE" = "ACTIVE",
  "INACTIVE" = "INACTIVE",
}


export interface IPlayerAdd {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone?: string;
  division: string;
  events: string[];
  teams?: string[];
}

export interface IPlayer extends IDocument {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  division: string;
  events?: string[];
  teams?: ITeam[] | string[];

  status: EPlayerStatus,
  profile: string | null;
  captainofteams: ITeam[] | string[] | null;
  cocaptainofteams: ITeam[] | string[] | null;
}

export type TAddPlayer = Omit<IPlayer, '_id' | 'status' | 'profile' | 'captainofteams' | 'cocaptainofteams'>;
export type TUpdatePlayer = Omit<IPlayer, '_id' | 'status' | 'profile' | 'captainofteams' | 'cocaptainofteams'> & {
  password: string;
  confirmPassword: string;
  prevTeamId: string;
  newTeamId: string;
};;

export interface IPlayerExpRel extends IDocument {
  firstName: string;
  lastName: string;
  profile: string | null;
  username: string;
  phone?: string;
  division: string;
  email?: string;
  status: EPlayerStatus,
  events?: IEvent[];
  teams?: ITeam[];
  captainofteams: ITeam[] | null;
  cocaptainofteams: ITeam[] | null;
}

export interface IPlayerRecord extends IPlayer {
  numOfGame: number;
  running: number;
  wins: number; // Number of games wins
  losses: number; // Number of games loses
  averagePointsDiff: number; // Points of wins os loses by how many points in each game on average
  rank?: number | null;
}


export interface IPlayerAndTeamsResponse extends IResponse {
  data: {
    player: IPlayer;
    teams: ITeamRelatives[];
    events: IEvent[];
  };
}



export interface IGetPlayersResponse extends IResponse {
  data: IPlayer[];
}

export interface IGetPlayerResponse extends IResponse {
  data: IPlayer;
}


export interface ISearchPlayerResponse extends IResponse {
  data: {
    event: IEvent;
    groups: IGroup[];
    players: IPlayer[];
    teams: ITeam[];
  };
}

export interface IGetEventsWithTeamsResponse extends IResponse {
  data: {
    events: IEvent[];
    teams: ITeamRelatives[];
  };
}



export interface IPlayerRank extends IPlayerExpRel {
  rank?: number;
}

export interface IUpdatePlayerResponse extends IResponse {
  data?: IPlayerExpRel;
}

export type TPlayerMutationFunction = useMutation.MutationFunction<
  {
    updatePlayer: IUpdatePlayerResponse;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

