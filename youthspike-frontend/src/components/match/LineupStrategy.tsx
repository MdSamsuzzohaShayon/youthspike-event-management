import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { INetRelatives, IPlayer, IRoundExpRel, IRoundRelatives } from '@/types';
import { EAssignStrategies } from '@/types/elements';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { randomAssign } from '@/utils/match/assignStrategies';
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


    const handlePASSelect = (e: React.SyntheticEvent, pas: EAssignStrategies) => { // PAS = Player Assign Strategies
        e.preventDefault();
        setOpenPasControl((prevState) => !prevState);

        // Check first assign or match up
        const matchUp = currRound?.firstPlacing === myTeamE ? false : true;

        switch (pas) {
            case EAssignStrategies.RANDOM:
                randomAssign({ matchUp, allNets, currRoundNets, myPlayers, roundList, currRound, myTeamE, dispatch });
                break;

            case EAssignStrategies.ANCHOR:
                // Ancher: Pair rank 1 player with last rank player, rank 2 player with 2nd last rank player and son on
                break;

            case EAssignStrategies.HIERARCHY:
                // Hierarchy: Pair rank 1 player with rank 2 player, rank 3 player with rank 4 player and so on
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