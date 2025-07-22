/* eslint-disable import/no-cycle */
import { Socket } from 'socket.io-client';
import React from 'react';
// import { INetRelatives, IRoom, IRoundRelatives, ITeam, IUserContext } from '.';
import type { INetRelatives, INetScoreUpdate, IUpdateScoreResponse } from './net';
import type { EActionProcess, IRoom, IRoomNets, ITeiBreakerAction } from './room';
import type { IRoundRelatives } from './round';
import { ETeam, ITeam } from './team';
import type { IAccessCode, IUser, IUserContext, UserRole } from './user';
import { IDefaultMatch, IMatchExpRel, IMatchRelatives } from './match';
import { IPlayer } from './player';

export interface IListenSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
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
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  myTeamE: ETeam;
}

// socket, dispatch, currRoom, currRound, currMatch, currNet, server, receiver
export interface ISetServerReceiverChange {
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currMatch: IMatchRelatives;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  currNetNum: number;
  server: string | null;
  receiver: string | null;
  accessCode: IAccessCode | null;
}

interface ICacheAction {
  match: string;
  net: string;
  room: string;
}

interface ICommonAction extends ICacheAction {
  receiver: string;
}

export interface IServiceFaultInput extends ICommonAction {}
export interface IDefensiveConversionInput extends ICommonAction {}
export interface IOneTwoThreePutAwayInput extends ICommonAction {}
export interface IRallyConversionInput extends ICommonAction {}

export interface IAceNoTouchInput extends ICommonAction {}
export interface IAceNoThirdTouchInput extends ICommonAction {}
export interface IReceivingHittingErrorInput extends ICommonAction {}

export interface IUpdateCachePointsInput extends ICacheAction {
  accessCode: string;
}

export interface IResetScoreInput {
  match: string;
  net: string | null;
  room: string | null;
  accessCode: string | null;
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

export interface ISetServerReceiverData {
  match: string;
  room: string;
  server: string;
  receiver: string;
  round: string;
  net: string;
  accessCode: string;
}

interface INetPoints {
  _id: string;
  teamAScore: number;
  teamBScore: number;
}

export interface IUpdatePointData {
  nets: INetPoints[];
  room: string;
  round: string;
  teamE: ETeam;
}

// roundList, dispatch, allNets, newRoundIndex, myTeamE
// Unused
export interface INextRoundProps {
  roundList: IRoundRelatives[];
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  newRoundIndex: number;
  myTeamE: ETeam;
}

export interface ICompleteMatchProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  match: IMatchRelatives;
}

export interface ISubmitUpdatePointsProps {
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  myTeamE: ETeam;
}

export interface ISubmitExtendOvertimeProps {
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
}

export interface IUpdateMultiplePointsProps extends ISubmitUpdatePointsProps {
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  allNets: INetRelatives[];
}

export interface ICanGoProps extends ICommonProps {
  next: boolean;
  currRoundNets: INetRelatives[];
  targetRoundIndex: number;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
}

export interface IListenPublicSocketProps {
  socket: Socket;
}

export interface IOvertimeData {
  roundList: IRoundRelatives[];
  nets: INetRelatives[];
  extendedOvertime: boolean;
}

/**
 * Score keeper
 */
export interface IServerReceiverOnNetMixed {
  mutate: number;
  server: string | IPlayer;
  servingPartner: string | IPlayer;
  receiver: string | IPlayer;
  receivingPartner: string | IPlayer;
  room: string;
  match: string | IMatch;
  net: string | INetRelatives;
  round: string | IRoundRelatives;
  teamAScore: number;
  teamBScore: number;

  // Optional related fields
  serverId?: string;
  netId?: string;
  receiverId?: string;
  receivingPartnerId?: string;
  servingPartnerId?: string;
  matchId?: string;
  roundId?: string;
}

export enum EServerReceiverAction {
  SERVER_ACE_NO_TOUCH = 'SERVER_ACE_NO_TOUCH',
  SERVER_ACE_NO_THIRD_TOUCH = 'SERVER_ACE_NO_THIRD_TOUCH',
  SERVER_RECEIVING_HITTING_ERROR = 'SERVER_RECEIVING_HITTING_ERROR',
  SERVER_DEFENSIVE_CONVERSION = 'SERVER_DEFENSIVE_CONVERSION',
  SERVER_DO_NOT_KNOW = 'SERVER_DO_NOT_KNOW',

  RECEIVER_SERVICE_FAULT = 'RECEIVER_SERVICE_FAULT',
  RECEIVER_ONE_TWO_THREE_PUT_AWAY = 'RECEIVER_ONE_TWO_THREE_PUT_AWAY',
  RECEIVER_RALLEY_CONVERSION = 'RECEIVER_RALLEY_CONVERSION',
  RECEIVER_DO_NOT_KNOW = 'RECEIVER_DO_NOT_KNOW',
}

/**
 * Responses
 */

// Score keeper
interface IServerReceiverCommonResponse{
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
}
export interface IResetServerReceiverResponse extends IServerReceiverCommonResponse {
  data: {net: string};
}

export interface IServerReceiverResponse extends IServerReceiverCommonResponse{
  data: IServerReceiverOnNetMixed;
}
export interface ISRConfirmResponse extends IServerReceiverResponse {
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

// Run match
export interface ICheckInResponse {
  data: IRoom;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
}

export interface ILineUpResponse {
  data: IRoomNets;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
}

export interface IUpdatePointsResponse {
  data: IUpdateScoreResponse;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  currentRound: IRoundRelatives | null;
  match: IMatchRelatives;
}

export interface IUpdateExtendOvertimeResponse {
  data: IOvertimeData;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  match: IMatchRelatives;
}

export interface IUpdateNetResponse {
  data: ITeiBreakerAction;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
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

// IServerReceiverResponse, ICheckInResponse, ILineUpResponse, IUpdatePointsResponse, IUpdateExtendOvertimeResponse, IUpdateNetResponse, IRoundMatchCommon, IRoundUpdateData, INetUpdateData, ITeamCaptain, IMatch, IUpdateRound, IUpdateNet
