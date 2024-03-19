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

export interface IEvent extends IDefaultEventMatch {
  _id: string;
  name: string;
  divisions: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  sponsors: IEventSponsor[];
  ldo?: ILDO;
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
