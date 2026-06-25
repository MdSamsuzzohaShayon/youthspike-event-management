/* eslint-disable import/no-cycle */
import React from 'react';
import { ICommonMatchEvent, IMatch, IMatchExpRel } from './match';
import { EAssignStrategies, IResponse } from './elements';
import { IPlayer } from './player';
import { ITeam, ITeamRelatives } from './team';
import { ILDO, ILDOItem } from './ldo';
import { IGroup, IGroupExpRel } from './group';
import { IPlayerStats, IProStats } from './playerStats';
import { INetRelatives } from './net';
import { IRoundRelatives } from './round';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';

export enum EEventPeriod {
  UPCOMING = 'UPCOMING',
  CURRENT = 'CURRENT',
  PAST = 'PAST',
}

export enum ERosterLock {
  FIRST_ROSTER_SUBMIT = 'FIRST_ROSTER_SUBMIT',
  PICK_A_DATE = 'PICK_A_DATE',
}

export enum ETieBreakingStrategy {
  TWO_POINTS_NET = 'TWO_POINTS_NET',
  OVERTIME_ROUND = 'OVERTIME_ROUND',
  MATCH_TIE = 'MATCH_TIE'
}

export interface IEventSponsor {
  _id: string;
  company: string;
  logo: string | Blob;
  event: string;
}

export interface IUpdatedivisions{
  prev?: string;
  new?: string;
}


export interface IDefaultEventMatch extends ICommonMatchEvent {
  nets: number;
  rounds: number;
}

export interface IEvent extends IDefaultEventMatch {
  _id: string;
  name: string;
  logo: null | string;
  divisions: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  sponsors: string[];
  defaultSponsor: boolean;
  sendCredentials: boolean;
  autoAssignLogic: EAssignStrategies;

  multiplayer: IProStats | null;
  weight: IProStats | null;
  stats: IProStats | null;
}

export interface IEventExpRel extends IEvent {
  matches: IMatch[];
  players: IPlayer[];
  teams: ITeam[];
  ldo: ILDOItem;
  groups: IGroup[];
}

export interface IEventRelatives extends IEvent {
  matches:string[];
  players: string[];
  teams: string[];
  ldo: string;
  groups:string[];
}

export interface IEventAdd extends IDefaultEventMatch {
  name: string;
  logo?: null | string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  ldo?: string;
  divisions: string;
  // sponsors: File[];
  coachPassword: string;
  defaultSponsor: boolean;
  tieBreaking: ETieBreakingStrategy;
}

export type TUpdateEvent = Partial<IEventAdd> & {
  updatedivisions?: IUpdatedivisions[];
}

export interface IAllStats{
  playerId: string;
  stats: IPlayerStats[]
}

export interface IGetPlayerEventSettingsQuery extends IResponse {
  data: {
    event?: IEvent;
    teams?: ITeamRelatives[];
    ldo?: ILDO;
    sponsors?: IEventSponsor[];
    multiplayer?: IProStats;
    weight?: IProStats;
    stats?: IProStats;
    player?: IPlayer;
  };
}



export interface IEventWithMatchesResponse {
  getEventWithMatches: {
    __typename: string;
    code: number;
    success: boolean;
    message: string;
    data: {
      __typename: string;
      event: IEventExpRel;
      matches: IMatchExpRel[];
      teams: ITeam[];
      ldo: ILDO;
      nets: INetRelatives[];
      rounds: IRoundRelatives[];
      groups: IGroupExpRel[];
    };
  };
}




export interface ICreateEventResponse extends IResponse{
  data: IEventExpRel;
}


export type TDeleteEventMutationFunction = useMutation.MutationFunction<
  {
    deleteEvent: IResponse;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;
