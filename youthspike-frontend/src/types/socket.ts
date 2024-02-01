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
    roundList: IRoundRelatives[]
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

export interface INextRoundProps extends ICommonProps {
    socket: Socket | null;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
    allNets: INetRelatives[];
    currRoom: IRoom | null;
    newRoundIndex: number;
    myTeamE: ETeam;
}


export interface ISubmitUpdatePointsdProps {
    socket: Socket | null;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
    allNets: INetRelatives[];
    currRoom: IRoom | null;
    currRound: IRoundRelatives | null;
    currRoundNets: INetRelatives[];
}

export interface ICanGoProps extends ICommonProps {
    next: boolean;
    currRoundNets: INetRelatives[];
    dispatch: React.Dispatch<React.ReducerAction<any>>;
}

