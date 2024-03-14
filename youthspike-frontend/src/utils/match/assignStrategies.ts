import { INetRelatives, IPlayer, IRoundRelatives } from "@/types";
import findPrevPartner from "./findPrevPartner";
import { ETeam } from "@/types/team";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";

interface IRandomAssignProps {
    matchUp: boolean;
    allNets: INetRelatives[];
    currRoundNets: INetRelatives[];
    myPlayers: IPlayer[];
    roundList: IRoundRelatives[];
    currRound: IRoundRelatives | null;
    myTeamE: ETeam;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
}

function randomAssign({ matchUp, allNets, currRoundNets, myPlayers, roundList, currRound, myTeamE, dispatch }: IRandomAssignProps) {

    const newCurrRoundNets = [];
    const allNetsClone = allNets.slice();

    // ===== Create a set to store selected player IDs =====
    const selectedPlayerIds = new Set();

    for (let i = 0; i < currRoundNets.length; i++) {
        // Make a copy of the available players
        const availablePlayers = myPlayers.filter(player => !selectedPlayerIds.has(player._id));

        if (availablePlayers.length < 2) {
            console.error("Not enough available players");
            break;
        }

        // Shuffle the available players
        const shuffled = availablePlayers.sort(() => 0.5 - Math.random());

        // Select the two players
        let rp1 = shuffled.length > 0 ? shuffled[0]._id : null, rp2 = shuffled.length > 1 ? shuffled[1]._id : null;

        // Make sure not to play with previous partnet
        const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });

        if(matchUp){
            if (prevPartnerId && rp2 === prevPartnerId) rp2 = shuffled.length > 2 ? shuffled[2]._id : null;
            // Make sure to make proper net veriance
            
        }



        const netObj = { ...currRoundNets[i] };
        if (myTeamE === ETeam.teamA) {
            netObj.teamAPlayerA = rp1;
            netObj.teamAPlayerB = rp2;
        } else {
            netObj.teamBPlayerA = rp1;
            netObj.teamBPlayerB = rp2;
        }

        newCurrRoundNets.push(netObj);

        // Add the selected player IDs to the set
        if (rp1) selectedPlayerIds.add(rp1);
        if (rp2) selectedPlayerIds.add(rp2);

        // Update all nets
        const fni = allNetsClone.findIndex((n) => n._id === currRoundNets[i]._id);
        if (fni !== -1) {
            allNetsClone[fni] = netObj;
        }
    }

    dispatch(setCurrentRoundNets(newCurrRoundNets));
    dispatch(setNets(allNetsClone));
}

export { randomAssign };