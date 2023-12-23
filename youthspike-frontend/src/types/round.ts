import { IMatchExpRel, IMatchRelatives, INetBase, IPlayer } from ".";

interface IRoundBase {
    _id: string;
    num: number;
    teamAScore?: number;
    teamBcore?: number;
}

interface IRoundRelatives extends IRoundBase{
    match: string;
    nets?: string[];
    players: string[];
    subs: string[];
}

interface IRoundExpRel extends IRoundBase{
    match: IMatchRelatives;
    nets?: INetBase[];
    players: IPlayer[];
    subs: IPlayer[];
}

export type { IRoundBase, IRoundRelatives, IRoundExpRel };