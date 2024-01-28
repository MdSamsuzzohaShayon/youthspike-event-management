import { IMatchExpRel, IMatchRelatives, INetBase, INetRelatives, IPlayer } from ".";
import { ETeam } from "./team";

export enum EActionProcess {
    INITIATE,
    CHECKIN,
    PLACING,
    LINEUP,
};


interface IRoundBase {
    _id: string;
    num: number;
    firstPlacing: ETeam;
    teamAScore?: number;
    teamBScore?: number;
    teamAProcess: string; // Oponent Team
    teamBProcess: string; // My Team
}

interface IRoundRelatives extends IRoundBase {
    match: string;
    nets?: string[];
    players: string[];
    subs: string[];
}

interface IRoundExpRel extends IRoundBase {
    match: IMatchRelatives;
    nets?: INetRelatives[];
    players: IPlayer[];
    subs: IPlayer[];
}

export type { IRoundBase, IRoundRelatives, IRoundExpRel };