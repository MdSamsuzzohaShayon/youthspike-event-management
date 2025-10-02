/* eslint-disable no-unused-vars */
/* eslint-disable import/no-cycle */
import React from "react";
import { IMessage } from "./elements";
import { IDefaultMatch, IMatchExpRel, IMatchRelatives } from "./match";
import { ILDO } from "./ldo";
import { IGroup, IGroupRelatives } from "./group";
import { ITeam } from "./team";
import { IPlayer } from "./player";
import { INetRelatives } from "./net";
import { IRoundRelatives } from "./round";
import { IMatch } from "./socket";
import { IServerReceiverSinglePlay } from "./serverReceiverOnNet";
import { IPlayerStats } from "./playerStats";

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
  setMessage: React.Dispatch<React.SetStateAction<IMessage | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  prevEvent?: IEvent;
}

export interface IAllStats{
  playerId: string;
  stats: IPlayerStats[]
}

export interface IEventDetailData {
  event: IEvent;
  matches: IMatch[];
  teams: ITeam[];
  players: IPlayer[];
  ldo: ILDO;
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  groups: IGroupRelatives[];
  sponsors: IEventSponsor[];
  statsOfPlayer: IAllStats[];
}

export interface IEventFilter{
  item:  EEventItem,
  search?: string;
  division?: string;
  group?: string;
  limit?: number;
}

// eslint-disable-next-line no-shadow
export enum EEventPeriod {
  UPCOMING = "UPCOMING",
  CURRENT = "CURRENT",
  PAST = "PAST",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED"
}

// eslint-disable-next-line no-shadow
export enum EEventItem {
  PLAYER = "PLAYER",
  MATCH = "MATCH",
  TEAM = "TEAM",
}
