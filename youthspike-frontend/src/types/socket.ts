/* eslint-disable import/no-cycle */
import { Socket } from 'socket.io-client';
import React from 'react';
// import { INetRelatives, IRoom, IRoundRelatives, ITeam, IUserContext } from '.';
import type { INetRelatives } from './net';
import type { IRoom } from './room';
import type { IRoundRelatives } from './round';
import type { ETeam, ITeam } from './team';
import type { IUserContext } from './user';
import { IMatchRelatives } from './match';

export interface IListenSocketProps {
  socket: Socket;
  match: IMatchRelatives;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currentRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  restartAudio: () => void;
}

export interface IJoinTheRoomProps {
  socket: Socket | null;
  userInfo: string | null;
  userToken: string | null;
  teamA?: ITeam | null;
  teamB?: ITeam | null;
  currRound: IRoundRelatives | null;
  matchId: string;
}

export interface INotTwoPointNetProps {
  socket: Socket | null;
  netId: string;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  dispatch: React.Dispatch<React.ReducerAction<any>>;
}

export interface IStatusChange {
  socket: Socket | null;
  user: IUserContext | null;
  teamA?: ITeam | null;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  dispatch: React.Dispatch<React.ReducerAction<any>>;
}

export interface ICheckInToLineupProps extends IStatusChange {
  myTeamE: ETeam;
  currRoundNets: INetRelatives[];
}

export interface ISubmitLineupProps extends ICheckInToLineupProps {
  teamB?: ITeam | null;
  myPlayerIds: string[];
}

export interface ICommonProps {
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
}

// roundList, dispatch, allNets, newRoundIndex, myTeamE
export interface INextRoundProps {
  roundList: IRoundRelatives[];
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  allNets: INetRelatives[];
  newRoundIndex: number;
  myTeamE: ETeam;
}


export interface ICompleteMatchProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  match: IMatchRelatives;
}

export interface ISubmitUpdatePointsProps {
  socket: Socket | null;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
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
