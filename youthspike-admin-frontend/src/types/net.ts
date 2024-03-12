import { IMatch, IRoundRelatives, ITeam } from ".";

export interface INetBase{
    num: number;
    points: number;
    teamAPlayerA: null | string;
    teamAPlayerB: null | string;
    teamAScore: number | null;
    teamBPlayerA: null | string;
    teamBPlayerB: null | string;
    teamBScore: number | null;
}


export interface INetRelatives extends INetBase{
    _id: string;
    match: string;
    round: string;
    teamA?: string;
    teamB?: string;
}

export interface INetExpRel extends INetBase{
    _id: string;
    match: IMatch;
    round: IRoundRelatives;
    teamA?: ITeam;
    teamB?: ITeam;
}