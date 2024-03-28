import React from "react";
import { IError, ILDO, ITeam } from ".";
import { IDocument } from "./document";
import { IDefaultMatch } from "./match";

export interface IDefaultEventMatch extends IDefaultMatch {
  nets: number;
  rounds: number;
}

export interface IEventSponsor{
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
  sponsors: IEventSponsor[];
  ldo?: ILDO;
  nets: number;
  rounds: number;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  coachPassword: string;
  location: string;
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
