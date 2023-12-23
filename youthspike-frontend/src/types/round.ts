import { IMatch, INetBase, IPlayer } from ".";

interface IRoundBase {
    _id: string;
    num: number;
}

interface IRoundRelatives extends IRoundBase{
    match: string;
    nets?: string[];
    players: string[];
    subs: string[];
}

interface IRoundExpRel extends IRoundBase{
    match: IMatch;
    nets?: INetBase[];
    players: IPlayer[];
    subs: IPlayer[];
}

export type { IRoundBase, IRoundRelatives, IRoundExpRel };