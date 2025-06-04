/* eslint-disable no-unused-vars */
/* eslint-disable import/no-cycle */
import React from 'react';
import { IError } from './elements';
import { IDefaultMatch, IMatchRelatives } from './match';
import { ILDO } from './ldo';
import { IGroup } from './group';

export interface IDefaultEventMatch extends IDefaultMatch {
  nets: number;
  rounds: number;
}

export interface IEventSponsor {
  _id: string;
  company: string;
  logo: string;
}

export interface IEvent {
  _id: string;
  name: string;
  divisions: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  logo?: string;
  sponsors: IEventSponsor[];
  ldo?: ILDO;
  groups: IGroup[];
  nets: number;
  rounds: number;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  coachPassword: string;
  description: string;
  location: string;
}

export interface IEventWMatch extends IEvent {
  matches: IMatchRelatives[] | string[];
}

export interface IEventAdd extends IDefaultEventMatch {
  name: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  ldo?: string;
  // sponsors: File[];
}

export interface IEventAddProps {
  update: boolean;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  prevEvent?: IEvent;
}

// eslint-disable-next-line no-shadow
export enum EEventPeriod {
  UPCOMING = 'UPCOMING',
  CURRENT = 'CURRENT',
  PAST = 'PAST',
}

// eslint-disable-next-line no-shadow
export enum EEventItem {
  PLAYER = 'PLAYER',
  MATCH = 'MATCH',
  TEAM = 'TEAM',
}
