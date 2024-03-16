import { IMatchRelatives, INetRelatives, IPlayer, IRoundRelatives } from "@/types";
import findPrevPartner from "../match/findPrevPartner";
import { ETeam } from "@/types/team";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { setDisabledPlayerIds } from "@/redux/slices/matchesSlice";

interface IRandomAssignProps {
    matchUp: boolean;
    allNets: INetRelatives[];
    currRoundNets: INetRelatives[];
    myPlayers: IPlayer[];
    opPlayers: IPlayer[];
    roundList: IRoundRelatives[];
    currRound: IRoundRelatives | null;
    myTeamE: ETeam;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
    currMatch: IMatchRelatives;
}


function getRandomPlayers(availablePlayers: IPlayer[]): [IPlayer | null, IPlayer | null] {
    const shuffled = availablePlayers.sort(() => 0.5 - Math.random());
    return [shuffled.length > 0 ? shuffled[0] : null, shuffled.length > 1 ? shuffled[1] : null];
}

function getRandomPartner(shuffled: IPlayer[], excludeId: string | null, netVariance: number, targetScore: number): IPlayer | null {
    return shuffled.find((p) => {
        if (p.rank && p._id !== excludeId && p.rank + netVariance <= targetScore) {
            return p;
        }
    }) || null;
}


function findPairWithMaxScore(availablePlayers: IPlayer[], maxPairScore: number) {
    for (let mI = 0; mI < availablePlayers.length; mI++) {
        const tempRp1 = availablePlayers[mI];
        for (let mJ = mI + 1; mJ < availablePlayers.length; mJ++) {
            const tempRp2 = availablePlayers[mJ];
            const nps = (tempRp1?.rank || 0) + (tempRp2?.rank || 0);
            if (nps <= maxPairScore) {
                return [tempRp1, tempRp2];
            }
        }
    }
    return [null, null];
}

function findPairWithMinScore(availablePlayers: IPlayer[], minPairScore: number) {
    for (let mI = 0; mI < availablePlayers.length; mI++) {
        const tempRp1 = availablePlayers[mI];
        for (let mJ = mI + 1; mJ < availablePlayers.length; mJ++) {
            const tempRp2 = availablePlayers[mJ];
            const nps = (tempRp1?.rank || 0) + (tempRp2?.rank || 0);
            if (nps >= minPairScore) {
                return [tempRp1, tempRp2];
            }
        }
    }
    return [null, null];
}

function randomAssign(props: IRandomAssignProps) {
    const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch } = props;
    const newCurrRoundNets = [];
    const allNetsClone = allNets.slice();
    const selectedPlayerIds = new Set();

    for (let i = 0; i < currRoundNets.length; i++) {
        const availablePlayers = myPlayers.filter(player => !selectedPlayerIds.has(player._id) && player.rank);

        if (availablePlayers.length < 2) {
            console.error("Not enough available players");
            break;
        }

        let [rp1, rp2] = getRandomPlayers(availablePlayers);

        const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

        if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
            rp2 = getRandomPartner(availablePlayers, prevPartnerId, currMatch.netVariance || 0, Infinity) || null;
        }

        let pairScore = (rp1?.rank || 0) + (rp2?.rank || 0);

        let op1, op2;
        if (myTeamE === ETeam.teamA) {
            op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
            op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
        } else {
            op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
            op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
        }
        let opPairScore = (op1?.rank || 0) + (op2?.rank || 0);

        if (currMatch.netVariance) {
            const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
            const maxPairScore = opPairScore + currMatch.netVariance;

            if (pairScore > maxPairScore && matchUp) {
                [rp1, rp2] = findPairWithMaxScore(availablePlayers, maxPairScore);
            } else if (pairScore < minPairScore && matchUp) {
                [rp1, rp2] = findPairWithMinScore(availablePlayers, minPairScore);
                if (!rp1 || !rp2) {
                    console.log({ pairScore, opPairScore, maxPairScore, minPairScore, msg: "Less than minimum" });
                }
            }

            const netObj = { ...currRoundNets[i] };
            if (myTeamE === ETeam.teamA) {
                netObj.teamAPlayerA = rp1?._id || null;
                netObj.teamAPlayerB = rp2?._id || null;
            } else {
                netObj.teamBPlayerA = rp1?._id || null;
                netObj.teamBPlayerB = rp2?._id || null;
            }

            newCurrRoundNets.push(netObj);

            if (rp1) selectedPlayerIds.add(rp1._id);
            if (rp2) selectedPlayerIds.add(rp2._id);

            const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
            if (fni !== -1) {
                allNetsClone[fni] = netObj;
            }
        }
    }

    dispatch(setCurrentRoundNets(newCurrRoundNets));
    dispatch(setNets(allNetsClone));
    // @ts-ignore
    dispatch(setDisabledPlayerIds([...selectedPlayerIds]))
}

export default randomAssign;
