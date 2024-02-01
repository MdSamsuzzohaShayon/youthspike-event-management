import { IMatchRelatives, INetRelatives, IPlayer } from "@/types";
import { ETeamPlayer } from "@/types/net";
import { ETeam } from "@/types/team";

interface IOutRange {
    currMatch: IMatchRelatives;
    net?: INetRelatives | null | undefined;
    myPlayers: IPlayer[],
    opPlayers: IPlayer[],
    myTeamE: ETeam;
    playerSpot: ETeamPlayer
}

const findOutOfRange = ({ currMatch, net, myPlayers, opPlayers, myTeamE, playerSpot }: IOutRange): string[] => {
    const inavalidPlayerIds = [];
    const netVariance = currMatch.netVariance ? currMatch.netVariance : 0;
    const oponentNetPlayers = [];
    let oponentPairScore = 0;
    if (myTeamE === ETeam.teamA) {
        if (net?.teamBPlayerA) {
            const findPlayer = opPlayers.find((p) => p._id === net?.teamBPlayerA);
            if (findPlayer) oponentNetPlayers.push(findPlayer);
        }
        if (net?.teamBPlayerB) {
            const findPlayer = opPlayers.find((p) => p._id === net?.teamBPlayerB);
            if (findPlayer) oponentNetPlayers.push(findPlayer);
        }
    } else {
        if (net?.teamAPlayerA) {
            const findPlayer = opPlayers.find((p) => p._id === net?.teamAPlayerA);
            if (findPlayer) oponentNetPlayers.push(findPlayer);
        }
        if (net?.teamAPlayerB) {
            const findPlayer = opPlayers.find((p) => p._id === net?.teamAPlayerB);
            if (findPlayer) oponentNetPlayers.push(findPlayer);
        }
    }

    if (oponentNetPlayers.length > 0) {
        for (let i = 0; i < oponentNetPlayers.length; i++) {
            // @ts-ignore
            if (oponentNetPlayers[i].rank) oponentPairScore += oponentNetPlayers[i].rank;
        }

        const startRange = oponentPairScore >= netVariance ? oponentPairScore - netVariance : 0;
        const endRange = oponentPairScore + netVariance;

        let partnerPlayer = null;
        let partnerRank = 0;

        if (myTeamE === ETeam.teamA) {
            if ((playerSpot == ETeamPlayer.TA_PA || playerSpot == ETeamPlayer.TB_PA) && net?.teamAPlayerB) {
                partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerB);
            } else if ((playerSpot == ETeamPlayer.TA_PB || playerSpot == ETeamPlayer.TB_PB) && net?.teamAPlayerA) {
                partnerPlayer = myPlayers.find((p) => p._id === net.teamAPlayerA);
            }
        } else {
            if ((playerSpot == ETeamPlayer.TB_PA || playerSpot == ETeamPlayer.TA_PA) && net?.teamBPlayerB) {
                partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerB);
            } else if ((playerSpot == ETeamPlayer.TB_PB || playerSpot == ETeamPlayer.TA_PB) && net?.teamBPlayerA) {
                partnerPlayer = myPlayers.find((p) => p._id === net.teamBPlayerA);
            }
        }


        if (partnerPlayer && partnerPlayer.rank) {
            partnerRank += partnerPlayer.rank;
        }

        // @ts-ignore
        const myTopRank = Math.max(...myPlayers.map(o => o.rank), 0);
        // @ts-ignore
        const myLowRank = Math.min(...myPlayers.map(o => o.rank), Infinity);

        let p = 0;
        while (p < myPlayers.length) {
            if (myPlayers[p] && myPlayers[p].rank) {
                // @ts-ignore
                let ourRank: number = myPlayers[p].rank + partnerRank;
                if (ourRank > endRange) {
                    if (!partnerPlayer) {
                        ourRank += myLowRank;
                        if (ourRank > endRange) {
                            inavalidPlayerIds.push(myPlayers[p]._id);
                        }
                    } else {
                        inavalidPlayerIds.push(myPlayers[p]._id);
                    }
                } else if (ourRank < startRange) {
                    if (!partnerPlayer) {
                        ourRank += myTopRank;
                        if (ourRank < startRange) {
                            inavalidPlayerIds.push(myPlayers[p]._id);
                        }
                    } else {
                        inavalidPlayerIds.push(myPlayers[p]._id);
                    }
                }
            }

            p += 1;
        }
    }

    return inavalidPlayerIds;
}

export default findOutOfRange;


