import { IMatchExpRel, IMatchRelatives, INetBase, INetRelatives, IPlayer } from ".";

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
    nets?: INetRelatives[];
    players: IPlayer[];
    subs: IPlayer[];
}

export type { IRoundBase, IRoundRelatives, IRoundExpRel };