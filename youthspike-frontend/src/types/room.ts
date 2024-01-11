export enum EActionProcess {
    INITIATE = 'INITIATE',
    CHECKIN = 'CHECKIN',
    PLACING = 'PLACING',
    LINEUP = 'LINEUP',
    LOCKED = 'LOCKED',
    COMPLETED = 'COMPLETED',
};

export interface IRoom {
    _id: string;
    match: string;
    round: string;
    teamA: null | string;
    teamAClient: null | string;
    teamAProcess: null | EActionProcess;
    teamB: null | string;
    teamBClient: null | string;
    teamBProcess: null | EActionProcess;
}

export interface ICheckIn {
    room: string;
    round: string;
    teamAProcess: string | null;
    teamBProcess: string | null;
}

export interface INetAssign {
    _id: string;
    teamAPlayerA: string | null | undefined;
    teamAPlayerB: string | null | undefined;
    teamBPlayerA:string | null | undefined;
    teamBPlayerB: string | null | undefined;
}

export interface ISubmitLineup {
    room: string;
    round: string;
    teamAProcess: string | null;
    teamBProcess: string | null;
    nets: INetAssign[]
}