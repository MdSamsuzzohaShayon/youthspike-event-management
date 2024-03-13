import { Socket } from "socket.io-client";
import { IError, INetRelatives, IRoom, IRoundRelatives, ITeam, IUserContext } from ".";
import React from "react";
import { ETeam } from "./team";

export interface IListenSocketProps {
    socket: Socket;
    user: IUserContext;
    teamA?: ITeam | null;
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

