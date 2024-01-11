import { IPlayer } from ".";

interface INetBase {
    _id: string;
    num: number;
    points: number;
    teamAScore: number;
    teamBScore: number;
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
    teamAScore?: number;
    teamBScore?: number;
}



export type { INetBase, INetRelatives, INetUpdate };