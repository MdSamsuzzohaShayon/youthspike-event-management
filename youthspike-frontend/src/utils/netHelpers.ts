// utils/netHelpers.ts

import { ETeam } from "@/types/team";
import { INetRelatives } from "@/types/net";
import { ETeamPlayer } from "@/types/net";

export function getNetPlayerId(
    net: INetRelatives,
    team: ETeam,
    spot: ETeamPlayer
): string | null {
    const isTeamA = team === ETeam.teamA;

    const map = {
        [ETeamPlayer.PLAYER_A]: isTeamA
            ? net.teamAPlayerA
            : net.teamBPlayerA,
        [ETeamPlayer.PLAYER_B]: isTeamA
            ? net.teamAPlayerB
            : net.teamBPlayerB,
    };

    return map[spot] || null;
}

export function updateNetPlayer(
    net: INetRelatives,
    team: ETeam,
    spot: ETeamPlayer,
    value: string | null
) {
    const isTeamA = team === ETeam.teamA;

    if (spot === ETeamPlayer.PLAYER_A) {
        return isTeamA
            ? { ...net, teamAPlayerA: value }
            : { ...net, teamBPlayerA: value };
    }

    return isTeamA
        ? { ...net, teamAPlayerB: value }
        : { ...net, teamBPlayerB: value };
}