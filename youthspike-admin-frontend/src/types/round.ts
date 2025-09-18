import { EActionProcess, INetRelatives } from ".";

export interface IRoundBase {
    num: number,
    teamAScore?: null | number,
    teamBScore?: null | number,
    teamAProcess: EActionProcess;
    teamBProcess: EActionProcess;
}

export interface IRoundRelatives extends IRoundBase {
    _id: string;
    match: string;
    players: string[];
    nets: string[];
    subs: string[];
}

export interface IRoundExpRel extends IRoundBase {
    _id: string;
    match: string;
    players: string[];
    nets: INetRelatives[];
    subs: string[];
}