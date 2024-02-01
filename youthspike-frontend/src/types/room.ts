import { INetPlayers } from ".";

export enum EActionProcess {
    INITIATE = 'INITIATE',

    CHECKIN = 'CHECKIN',

    LINEUP = 'LINEUP',
    LINEUP_SUBMITTED = 'LINEUP_SUBMITTED',

    LOCKED = 'LOCKED',
    COMPLETE = 'COMPLETE',
};

export interface IRoomRoundProcess {
    _id: string;
    teamAProcess: null | EActionProcess;
    teamBProcess: null | EActionProcess;
}

export interface IRoom {
    _id: string;
    match: string;
    teamA: null | string;
    teamAClient: null | string;
    teamB: null | string;
    teamBClient: null | string;
    rounds: IRoomRoundProcess[];
}

export interface IRoomNets extends IRoom {
    nets: INetPlayers[]
}

export interface ICheckIn {
    room: string;
    round: string;
    teamAProcess: string | null;
    teamBProcess: string | null;
}

export interface IRoomNetAssign {
    _id: string;
    teamAPlayerA: string | null | undefined;
    teamAPlayerB: string | null | undefined;
    teamBPlayerA: string | null | undefined;
    teamBPlayerB: string | null | undefined;
}

export interface ICheckInAction {
    room: string | null;
    round: string | null;
    teamAProcess: string | null;
    teamBProcess: string | null;
    nets: IRoomNetAssign[];
}

export interface ISubmitLineup {
    room: string;
    round: string;
    teamAProcess: string | null;
    teamBProcess: string | null;
    nets: IRoomNetAssign[]
}