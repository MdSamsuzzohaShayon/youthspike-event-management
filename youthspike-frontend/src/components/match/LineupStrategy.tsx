import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { INetRelatives, IPlayer, IRoundExpRel, IRoundRelatives } from '@/types';
import { EAssignStrategies } from '@/types/elements';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import findPrevPartner from '@/utils/match/findPrevPartner';
import React, { useState } from 'react'

interface ILineupProps {
    myTeamE: ETeam;
    currRound: IRoundRelatives | null;
    myPlayers: IPlayer[];
    currRoundNets: INetRelatives[];
    allNets: INetRelatives[];
    roundList: IRoundRelatives[]
}

function LineupStrategy({ myTeamE, currRound, myPlayers, currRoundNets, allNets, roundList }: ILineupProps) {

    const dispatch = useAppDispatch();
    // Local State
    const [openPasControl, setOpenPasControl] = useState<boolean>(false); // pas = Player Assign Strategy

    const playerAssignStrategies = useAppSelector((state) => state.elements.playerAssignStrategy);

    const randomAssign = (matchUp: boolean) => {

        const newCurrRoundNets = [];
        const allNetsClone = allNets.slice();

        // Create a set to store selected player IDs
        const selectedPlayerIds = new Set();

        for (let i = 0; i < currRoundNets.length; i++) {
            // Make a copy of the available players
            const availablePlayers = myPlayers.filter(player => !selectedPlayerIds.has(player._id));

            // Check if there are enough available players
            if (availablePlayers.length < 2) {
                // Handle the case where there are not enough players
                console.error("Not enough available players");
                break;
            }

            // Shuffle the available players
            const shuffled = availablePlayers.sort(() => 0.5 - Math.random());

            // Select the two players
            let rp1 = shuffled.length > 0 ? shuffled[0]._id : null, rp2 = shuffled.length > 1 ? shuffled[1]._id : null;

            // Make sure not to play with previous partnet
            const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net: currRoundNets[i] });
            if (matchUp && prevPartnerId && rp2 === prevPartnerId) rp2 = shuffled.length > 2 ? shuffled[2]._id : null;

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

    const handlePASSelect = (e: React.SyntheticEvent, pas: EAssignStrategies) => { // PAS = Player Assign Strategies
        /**
         * Arrange players randomly
         * Make sure not to select previous partner
         * If a player is selected, make sure not to select him in a net twice
         * Make sure of net variance when matching up
         * Set all nets and current round nets
         */
        e.preventDefault();
        setOpenPasControl((prevState) => !prevState);

        // Check first assign or match up
        const matchUp = currRound?.firstPlacing === myTeamE ? false : true;

        switch (pas) {
            case EAssignStrategies.RANDOM:
                randomAssign(matchUp);
                break;

            case EAssignStrategies.AUTO:
                randomAssign(matchUp);
                break;

            case EAssignStrategies.ANCHORING:
                randomAssign(matchUp);
                break;

            default:
                break;
        }
    }



    if (myTeamE === ETeam.teamA) {
        if (currRound?.firstPlacing === ETeam.teamA) {
            if (currRound.teamAProcess !== EActionProcess.CHECKIN || currRound.teamAScore) {
                return null;
            }
        } else {
            if (currRound?.teamBProcess !== EActionProcess.LINEUP || currRound.teamBScore) {
                return null;
            }
        }
    } else {
        if (currRound?.firstPlacing === ETeam.teamB) {
            if (currRound.teamBProcess !== EActionProcess.CHECKIN || currRound.teamBScore) {
                return null;
            }
        } else {
            if (currRound?.teamAProcess !== EActionProcess.LINEUP || currRound.teamAScore) {
                return null;
            }
        }
    }


    return (<div className="w-full flex justify-center items-center relative text-gray-100">
        <div className="h-6 w-6 border-0 rounded-full bg-yellow-500 flex justify-center items-center">
            <button type='button' onClick={e => setOpenPasControl((prevState) => !prevState)} >A</button>
        </div>
        {openPasControl && (
            <ul className="player-select-strategy bg-gray-800 w-24 absolute bottom-6 inset-x-0 z-20" style={{ left: '50%', transform: 'translate(-50%)' }} >
                {playerAssignStrategies.map((pas) => (
                    <li className='p-2 border-b border-yellow-500 capitalize' key={pas} role="presentation" onClick={e => handlePASSelect(e, pas)} >{pas}</li>
                ))}
            </ul>
        )}
    </div>)
}

export default LineupStrategy