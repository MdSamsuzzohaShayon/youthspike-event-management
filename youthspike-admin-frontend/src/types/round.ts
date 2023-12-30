export interface IRoundBase {
    num: number,
    teamAScore?: null | number,
    teamBScore?: null | number,
}

export interface IRoundRelatives extends IRoundBase {
    _id: string;
    match: string;
    players: string[];
    nets: string[];
    subs: string[];
}