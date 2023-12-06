import { IError, ITeam } from ".";
import { IDocument } from "./document";

export interface IEvent extends IDocument {
  name: string;
  divisions: string;
  nets: number;
  rounds: number;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  timeout: number;
  passcode: string;
  coachPassword: string;
  location: string;
  rosterLock: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  sponsors: string[];
}

export interface IEventAdd {
  name: string;
  divisions: string;
  nets: number;
  rounds: number;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  timeout: number;
  passcode: string;
  coachPassword: string;
  location: string;
  rosterLock: string;
  startDate: string;
  endDate: string;
  playerLimit: number;
  active: boolean;
  ldo?: string;
  // sponsors: File[];
}

export interface IEventAddProps {
  update: boolean;
  setActErr: (state: IError) => void;
  setIsLoading: (state: boolean) => void;
  prevEvent?: IEvent;
}
