/* eslint-disable import/no-cycle */
import { Socket } from "socket.io-client";
import React from "react";
import type {
  INetRelatives,
  INetScoreUpdate,
  IUpdateScoreResponse,
} from "./net";
import type {
  EActionProcess,
  IRoom,
  IRoomNets,
  ITeiBreakerAction,
} from "./room";
import type { IRoundRelatives } from "./round";
import { ETeam, ITeam } from "./team";
import type { IAccessCode, IUserContext, UserRole } from "./user";
import { IMatchExpRel, IMatchRelatives } from "./match";
import { IPlayer } from "./player";
import { EServerPositionPair } from "./serverReceiverOnNet";

export interface IListenSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
}

export interface IJoinTheRoomProps {
  user: IUserContext;
  teamA?: ITeam | null;
  teamB?: ITeam | null;
  currRound: IRoundRelatives | null;
  matchId: string;
}

export interface INotTwoPointNetProps {
  netId: string;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
}

export interface IStatusChange {
  socket: Socket | null;
  user: IUserContext | null;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  myTeamE: ETeam;
}

// socket, dispatch, currRoom, currRound, currMatch, currNet, server, receiver
export interface ISetServerReceiverChange {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currMatch: IMatchRelatives;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  currNetNum: number;
  server: string | null;
  receiver: string | null;
  accessCode: IAccessCode | null;
}



interface ICommonAction {
  match: string;
  net: string;
  room: string;
}

export interface IServiceFaultInput extends ICommonAction {}
export interface IDefensiveConversionInput extends ICommonAction {}
export interface IOneTwoThreePutAwayInput extends ICommonAction {}
export interface IRallyConversionInput extends ICommonAction {}

export interface IAceNoTouchInput extends ICommonAction {}
export interface IAceNoThirdTouchInput extends ICommonAction {}
export interface IServerDoNotKnowInput extends ICommonAction {}
export interface IReceiverDoNotKnowInput extends ICommonAction {}
export interface IReceivingHittingErrorInput extends ICommonAction {}

export interface IUpdateCachePointsInput extends ICommonAction {
  accessCode: string;
}

interface IRevertResetCommon {
  match: string;
  net: string | null;
  accessCode: string | null;
}

export interface IResetScoreInput extends IRevertResetCommon {
  room: string | null;
}

export interface IRevertPlayInput extends IResetScoreInput {
  play: number | null;
}

export interface ICheckInToLineupProps extends IStatusChange {
  myTeamE: ETeam;
  currRoundNets: INetRelatives[];
}

export interface ISubmitLineupProps extends ICheckInToLineupProps {
  eventId: string;
  teamA?: ITeam | null;
  teamB?: ITeam | null;
  myPlayerIds: string[];
}

export interface ICommonProps {
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
}

export interface IJoinData {
  match: string;
  round: string;
  userRole: UserRole;
  userId?: string;
  team?: string | null;
}

export interface ICheckInData {
  room: string;
  round: string;
  teamAProcess: EActionProcess;
  teamBProcess: EActionProcess;
  userId: string;
  userRole: UserRole;
  teamE?: ETeam;
}

export interface ISetServerReceiverDataInput {
  match: string;
  room: string;
  server: string;
  receiver: string;
  round: string;
  net: string;
  accessCode: string;
  serverPositionPair: EServerPositionPair;
}

interface INetPoints {
  _id: string;
  teamAScore: number | null;
  teamBScore: number | null;
}

export interface IUpdatePointData {
  net: INetPoints;
  room: string;
  round: string;
  teamE: ETeam;
}

// roundList, dispatch, allNets, newRoundIndex, myTeamE
// Unused
export interface INextRoundProps {
  roundList: IRoundRelatives[];
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  newRoundIndex: number;
  myTeamE: ETeam;
}

export interface ICompleteMatchProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  match: IMatchRelatives;
}

export interface ISubmitUpdatePointsProps {
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currNet: INetRelatives | null;
  myTeamE: ETeam;
}

export interface ISubmitExtendOvertimeProps {
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
}

export interface IUpdateMultiplePointsProps extends ISubmitUpdatePointsProps {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  allNets: INetRelatives[];
}

export interface ICanGoProps extends ICommonProps {
  next: boolean;
  currRoundNets: INetRelatives[];
  targetRoundIndex: number;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
}

export interface IListenPublicSocketProps {
  socket: Socket;
}

export interface IOvertimeData {
  roundList: IRoundRelatives[];
  nets: INetRelatives[];
  extendedOvertime: boolean;
}

// Run match
export interface ICheckInResponse {
  data: IRoom;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
}

export interface ILineUpResponse {
  data: IRoomNets;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
  currMatch: IMatchRelatives;
}

export interface IUpdatePointsResponse {
  data: IUpdateScoreResponse;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
  match: IMatchRelatives;
}

export interface IUpdateExtendOvertimeResponse {
  data: IOvertimeData;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  match: IMatchRelatives;
}

export interface IUpdateNetResponse {
  data: ITeiBreakerAction;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  match: IMatchRelatives;
}

/**
 * Action data
 */
export interface IRoundMatchCommon {
  _id: string;
  match: string;
}
export interface IRoundUpdateData extends IRoundMatchCommon {
  teamAProcess: EActionProcess;
  teamBProcess: EActionProcess;
}

export interface INetUpdateData extends IRoundMatchCommon {
  nets: INetScoreUpdate[];
  matchCompleted: boolean;
}

export interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

export interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

export interface IUpdateRound {
  setMatchList: React.Dispatch<React.SetStateAction<IMatch[]>>;
  actionData: IRoundUpdateData;
  matchList: IMatch[];
}

export interface IUpdateNet {
  setMatchList: React.Dispatch<React.SetStateAction<IMatch[]>>;
  actionData: INetUpdateData;
  matchList: IMatch[];
}