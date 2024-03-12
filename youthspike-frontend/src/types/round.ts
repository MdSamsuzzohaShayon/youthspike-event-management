import { IMatchExpRel, IMatchRelatives, INetBase, INetRelatives, IPlayer } from ".";
import { EActionProcess } from "./room";
import { ETeam } from "./team";

// export enum EActionProcess {
//     INITIATE ="INITIATE",
//     CHECKIN = "CHECKIN",
//     PLACING="PLACING",
//     LINEUP,
// };


interface IRoundBase {
    _id: string;
    num: number;
    firstPlacing: ETeam;
    completed: boolean;
    teamAScore?: number | null;
    teamBScore?: number | null;
    teamAProcess: EActionProcess; // Oponent Team
    teamBProcess: EActionProcess; // My Team
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