/* eslint-disable import/no-cycle */
import { IEvent } from "./event";
import { IGroup } from "./group";
import { ILDO } from "./ldo";
import { INetRelatives } from "./net";
import { IPlayer } from "./player";
import { IPlayerRanking, IPlayerRankingExpRel } from "./playerRanking";
import { IRoom } from "./room";
import { IRoundExpRel, IRoundRelatives } from "./round";
import {
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
} from "./serverReceiverOnNet";
import { ITeam } from "./team";

// eslint-disable-next-line no-shadow
export enum ETieBreakingStrategy {
  // eslint-disable-next-line no-unused-vars
  TWO_POINTS_NET = "TWO_POINTS_NET",
  // eslint-disable-next-line no-unused-vars
  OVERTIME_ROUND = "OVERTIME_ROUND",
}

export enum EMatchStatus {
  UPCOMING = "UPCOMING",
  COMPLETED = "COMPLETED",
  SCHEDULED = "SCHEDULED",
  ASSIGNING = "ASSIGNING",
  LIVE = "LIVE",
}

export interface IDefaultMatch {
  division: string;
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  coachPassword: string;
  description: string;
  location: string;
  tieBreaking: ETieBreakingStrategy;
  fwango?: string | null;
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}

interface IMatchBase extends Partial<IDefaultMatchProps> {
  date: string;
  extendedOvertime?: boolean;
  teamAP?: number;
  teamBP?: number;
}

export interface IAddMatch extends IMatchBase {
  teamA: string;
  teamB: string;
}

export interface IMatchRelatives extends IMatchBase {
  _id: string;
  completed: boolean;
  event: string;
  teamA: string;
  teamB: string;
  rounds: string[];
  group?: string;
}

export interface IMatchExpRel extends IMatchBase {
  _id: string;
  completed: boolean;
  event: IEvent;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundExpRel[];
  nets: INetRelatives[];
  room: IRoom;
  group?: IGroup;

  teamARanking?: IPlayerRankingExpRel;
  teamBRanking?: IPlayerRankingExpRel;

  serverReceiverOnNet?: IServerReceiverOnNetMixed[];
  serverReceiverSinglePlay?: IServerReceiverSinglePlay[];
}

export interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

export interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
  status: EMatchStatus;
}

interface ISearchMatchData {
  event: IEvent;
  groups: IGroup[];
  ldo: ILDO;
  matches: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  teams: ITeamCaptain[];
}

export interface ISearchMatchResponse {
  code: number;
  success: boolean;
  message: string;
  data: ISearchMatchData;
}

export interface ISearchFilter {
  search: string;
  division: string;
  group: string;
  matchFilter: string;
  status: string;
  limit?: number;
  offset?: number;
}

export interface ISearchLimitFilter extends ISearchFilter {
  limit: number;
  offset: number;
}


export interface IUpdateMatchResponse {
  updateMatch: {
    success: boolean;
    message: string;
  };
}
