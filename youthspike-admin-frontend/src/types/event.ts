/* eslint-disable import/no-cycle */
import React from 'react';
import { ICommonMatchEvent, IMatch } from './match';
import { EAssignStrategies, IError } from './elements';
import { IPlayer } from './player';
import { ITeam } from './team';
import { ILDO } from './ldo';
import { IGroup } from './group';

export enum EEventPeriod {
  UPCOMING = 'UPCOMING',
  CURRENT = 'CURRENT',
  PAST = 'PAST',
}


export enum ERosterLock{
  FIRST_ROSTER_SUBMIT="FIRST_ROSTER_SUBMIT",
  PICK_A_DATE="PICK_A_DATE"
}

export enum ETieBreakingStrategy {
  TWO_POINTS_NET = 'TWO_POINTS_NET',
  OVERTIME_ROUND = 'OVERTIME_ROUND',
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
  groups: IGroup[];
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
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  prevEvent?: IEvent;
}
