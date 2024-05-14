/* eslint-disable import/no-cycle */
import React from 'react';
import { ICommonMatchEvent, IMatch } from './match';
import { EAssignStrategies, IError } from './elements';
import { IPlayer } from './player';
import { ITeam } from './team';
import { ILDO } from './ldo';

export enum EEventPeriod {
  UPCOMING = 'UPCOMING',
  CURRENT = 'CURRENT',
  PAST = 'PAST',
}

export interface IEventSponsor {
  _id: string;
  company: string;
  logo: string;
  event: string;
}

export interface IEventSponsorAdd {
  company: string;
  logo: File | string | null;
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
  sendCredentials: boolean;
  autoAssignLogic: EAssignStrategies;
}

export interface IEventExpRel extends IEvent {
  matches: IMatch[];
  players: IPlayer[];
  teams: ITeam[];
  ldo: ILDO;
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
}

export interface IEventAddProps {
  update: boolean;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  prevEvent?: IEvent;
}
