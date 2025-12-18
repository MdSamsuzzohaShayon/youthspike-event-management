import { useMutation } from "@apollo/client/react";
import { IGroup, IGroupExpRel, IGroupRelatives, INetRelatives, IResponse, IRoundRelatives, ITeam } from ".";
import { ETieBreakingStrategy, IEventExpRel } from "./event";
import { ApolloCache } from "@apollo/client";

export interface ICommonMatchEvent{
  netVariance: number;
  homeTeam: string;
  autoAssign: boolean;
  includeStats: boolean;
  autoAssignLogic: string;
  rosterLock: string;
  timeout: number;
  description: string;
  location: string;
  accessCode?: string;
  tieBreaking: ETieBreakingStrategy;
  fwango?: string | null;
}

export interface IDefaultMatch extends ICommonMatchEvent{
  division: string;
  extendedOvertime?: boolean;
  teamAP?: number; // Plus minus points of teamA
  teamBP?: number; // Plus minus points of teamB
}

export interface IDefaultMatchProps extends IDefaultMatch {
  numberOfNets: number;
  numberOfRounds: number;
}


interface IMatchBase extends Partial<IDefaultMatchProps>{
  date: string;
  event: string;
  completed: boolean;
}

export interface IAddMatch extends IDefaultMatch{
  date: string;
  event: string;
  teamA: string;
  teamB: string;
  numberOfNets: number;
  numberOfRounds: number;
  group?: string;
  streamUrl?: string;
}

export interface IMatch extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
  group?: IGroupRelatives;
  nets: INetRelatives[];
}

export interface IMatchRelatives extends IMatchBase{
  _id: string;
  teamA: string;
  teamB: string;
  rounds: string[];
  nets: string[];
  group?: string;
}

export interface IMatchExpRel extends IMatchBase{
  _id: string;
  teamA: ITeam;
  teamB: ITeam;
  rounds: IRoundRelatives[];
  nets: INetRelatives[];
  group?: IGroup;
}

export interface IMatchAddProps {
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  groupList: IGroupExpRel[];
  currDivision?: string;
  update?: boolean;
  teamList?: ITeam[];
  matchId?: string;
  eventData?: IEventExpRel | null;
  showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
  prevMatch?: IMatchExpRel;
  addMatchCB?: (matchData: IMatchExpRel) => void;
}





export interface ICreateMatchData extends IResponse{
  data?: IMatchExpRel;
}

export type TMatchMutationFunction = useMutation.MutationFunction<{
  updateMatch: IResponse;
}, {
  [x: string]: any;
}, ApolloCache>;

export enum EMatchStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_STARTED = 'NOT_STARTED',
}
