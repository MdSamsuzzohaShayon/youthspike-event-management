import { IPlayer } from ".";

interface INetBase {
    _id: string;
    num: number;
    points: number;
    teamAScore: number | null;
    teamBScore: number | null;
    pairRange?: number;
}


interface INetRelatives extends INetBase {
    // match: string | Match;
    round: string;
    teamA?: string | null;
    teamB?: string | null;
    teamAPlayerA?: string | null;
    teamAPlayerB?: string | null;
    teamBPlayerA?: string | null;
    teamBPlayerB?: string | null;
}

interface INetUpdate {
    _id: string;
    teamAPlayerA?: string | null;
    teamAPlayerB?: string | null;
    teamBPlayerA?: string | null;
    teamBPlayerB?: string | null;
    teamAScore?: number | null;
    teamBScore?: number | null;
}

interface INetScoreUpdate {
    _id: string;
    teamAScore: number;
    teamBScore: number;
    completed: boolean;
}

interface IUpdateScoreResponse {
    nets: INetScoreUpdate[];
    room: string;
    round: INetScoreUpdate;
}

interface INetPlayers {
    _id: string;
    teamAPlayerA: string;
    teamAPlayerB: string;
    teamBPlayerA: string;
    teamBPlayerB: string;
}

export enum ETeamPlayer {
    TA_PA = "teamAPlayerA",
    TA_PB = "teamAPlayerB",
    TB_PA = "teamBPlayerA",
    TB_PB = "teamBPlayerB",
};



export type { INetBase, INetRelatives, INetUpdate, INetPlayers, INetScoreUpdate, IUpdateScoreResponse };