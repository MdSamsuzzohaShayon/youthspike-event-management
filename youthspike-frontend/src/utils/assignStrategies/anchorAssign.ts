import { IMatchRelatives, INetRelatives, IPlayer, IRoundRelatives } from "@/types";
import findPrevPartner from "../match/findPrevPartner";
import { ETeam } from "@/types/team";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { setDisabledPlayerIds } from "@/redux/slices/matchesSlice";

interface IanchorAssignProps {
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


function anchorAssign(props: IanchorAssignProps) {
    const { currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch } = props;
    const newCurrRoundNets = [];
    const allNetsClone = allNets.slice();
    const selectedPlayerIds = new Set();

    for (let i = 0; i < currRoundNets.length; i++) {
        // Make it asscending
        const availablePlayers = myPlayers
            .filter(player => !selectedPlayerIds.has(player._id) && player.rank)
            // @ts-ignore
            .sort((a, b) => a.rank - b.rank);

        if (availablePlayers.length < 2) {
            console.error("Not enough available players");
            break;
        }

        // Get rank 1 and last rank player
        let rp1: null | undefined | IPlayer = availablePlayers[0];
        let rp2: null | undefined | IPlayer = availablePlayers[availablePlayers.length - 1];

        const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });
        if (matchUp && prevPartnerId && rp2?._id === prevPartnerId) {
            rp2 = availablePlayers[availablePlayers.length - 2] || null;
        }

        let op1, op2;
        if (myTeamE === ETeam.teamA) {
            op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerA);
            op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamBPlayerB);
        } else {
            op1 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerA);
            op2 = opPlayers.find((p) => p._id === currRoundNets[i].teamAPlayerB);
        }

        if (currMatch.netVariance) {
            let pairScore = (rp1?.rank || 0) + (rp2?.rank || 0);
            let opPairScore = (op1?.rank || 0) + (op2?.rank || 0);
            const minPairScore = Math.max(0, opPairScore - currMatch.netVariance);
            const maxPairScore = opPairScore + currMatch.netVariance;

            if (pairScore > maxPairScore && matchUp) {
                // make new logic for it
                let found = false;
                let mI = 0;
                const limit = Math.ceil(availablePlayers.length / 2);
                while (limit) {
                    let tempRp1: null | undefined | IPlayer = availablePlayers[mI + 1];
                    let tempRp2: null | undefined | IPlayer = availablePlayers.find((p)=> p.rank && tempRp1?.rank && (p.rank + tempRp1?.rank) <= maxPairScore);
                    const nps = (tempRp1?.rank || 0) + (tempRp2?.rank || 0);
                    if (nps <= maxPairScore) {
                        rp1 = tempRp1;
                        rp2 = tempRp2;
                        found = true;
                        break;
                    }
                    mI += 1;
                }
                if (!found) {
                    rp1 = null;
                    rp2 = null;
                }
            } else if (pairScore < minPairScore && matchUp) {
                // make new logic for it
                let found = false;
                let mI = 0;
                const limit = Math.ceil(availablePlayers.length / 2);
                while (limit) {
                    let tempRp1: null | IPlayer = availablePlayers[mI + 1];
                    let tempRp2: null | IPlayer = availablePlayers[availablePlayers.length - (mI + 1)];
                    const nps = (tempRp1.rank || 0) + (tempRp2.rank || 0);
                    if (nps >= maxPairScore) {
                        rp1 = tempRp1;
                        rp2 = tempRp2;
                        found = true;
                        break;
                    }
                    mI += 1;
                }
                if (!found) {
                    rp1 = null;
                    rp2 = null;
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

export default anchorAssign;
