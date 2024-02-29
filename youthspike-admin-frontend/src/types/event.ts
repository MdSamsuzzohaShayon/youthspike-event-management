import React from "react";
import { IError, ILDO, IPlayer, ITeam } from ".";
import { IDocument } from "./document";
import { IDefaultMatch, IMatch } from "./match";
import { EAssignStrategies } from "./elements";
import { ApolloClient } from "@apollo/client";

export enum EEventPeriod{
  UPCOMING="UPCOMING",
  CURRENT="CURRENT",
  PASSED="PASSED",
}


export interface IEventSponsor{
  _id: string;
  company: string;
  logo: string;
  event: string;
}

export interface IEventSponsorAdd{
  company: string;
  logo: File | null ;
}

export interface IDefaultEventMatch extends IDefaultMatch {
  nets: number;
  rounds: number;
}


export interface IEvent extends IDefaultEventMatch {
  _id: string;
  name: string;
  logo: null | string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  sponsors: string[];
  autoAssignLogic: EAssignStrategies;
}

export interface IEventExpRel extends IEvent {
  matches: IMatch[],
  players: IPlayer[],
  teams: ITeam[],
  ldo: ILDO
}

export interface IEventAdd extends IDefaultEventMatch {
  name: string;
  logo?: null | string;
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
