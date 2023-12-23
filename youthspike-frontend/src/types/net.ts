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
    teamAPlayerA?: string;
    teamAPlayerB?: string;
    teamBPlayerA?: string;
    teamBPlayerB?: string;
}

interface INetPlayers {
    _id: string;
    teamAPlayerA?: string | null;
    teamAPlayerB?: string | null;
    teamBPlayerA?: string | null;
    teamBPlayerB?: string | null;
}


export type { INetBase, INetRelatives, INetPlayers };