/* eslint-disable import/no-cycle */
import { Socket } from 'socket.io-client';
import React from 'react';
// import { INetRelatives, IRoom, IRoundRelatives, ITeam, IUserContext } from '.';
import type { INetRelatives } from './net';
import type { EActionProcess, IRoom } from './room';
import type { IRoundRelatives } from './round';
import { ETeam, ITeam } from './team';
import type { IUserContext, UserRole } from './user';
import { IMatchRelatives } from './match';

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
