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

interface INetScoreUpdate{
    _id: string; 
    teamAScore: number; 
    teamBScore: number
}

interface INetPlayers {
    _id: string;
    teamAPlayerA: string;
    teamAPlayerB: string;
    teamBPlayerA: string;
    teamBPlayerB: string;
  }



export type { INetBase, INetRelatives, INetUpdate, INetPlayers, INetScoreUpdate};