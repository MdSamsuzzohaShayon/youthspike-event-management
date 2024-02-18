import { useAppSelector } from '@/redux/hooks';
import { INetRelatives, IRoundExpRel, IRoundRelatives } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import React, { useState } from 'react'

interface ILineupProps {
    myTeamE: ETeam;
    currRound: IRoundRelatives | null;
}

function LineupStrategy({ myTeamE, currRound}: ILineupProps) {
    // Local State
    const [openPasControl, setOpenPasControl] = useState<boolean>(false); // pas = Player Assign Strategy

    const playerAssignStrategies = useAppSelector((state) => state.elements.playerAssignStrategy);

    const handlePASSelect = (e: React.SyntheticEvent, pas: string) => { // PAS = Player Assign Strategies
        e.preventDefault();
        setOpenPasControl((prevState) => !prevState);

        console.log({ playerAssignStrategy: pas });

    }


    
    if(myTeamE === ETeam.teamA){
        if(currRound?.firstPlacing === ETeam.teamA){
            if(currRound.teamAProcess !== EActionProcess.CHECKIN || currRound.teamAScore){
                return null;
            }
        }else{
            if(currRound?.teamBProcess !== EActionProcess.LINEUP || currRound.teamBScore){
                return null;
            }
        }
    }else{
        if(currRound?.firstPlacing === ETeam.teamB){
            if(currRound.teamBProcess !== EActionProcess.CHECKIN || currRound.teamBScore){
                return null;
            }
        }else{
            if(currRound?.teamAProcess !== EActionProcess.LINEUP || currRound.teamAScore){
                return null;
            }
        }
    }


    return (<div className="w-full flex justify-center items-center relative text-gray-100">
        <div className="h-6 w-6 border-0 rounded-full bg-yellow-500 flex justify-center items-center">
            <button type='button' onClick={e => setOpenPasControl((prevState) => !prevState)} >A</button>
        </div>
        {openPasControl && (
            <ul className="player-select-strategy bg-gray-800 w-24 absolute bottom-6 inset-x-0" style={{ left: '50%', transform: 'translate(-50%)' }} >
                {playerAssignStrategies.map((pas) => (
                    <li className='p-2 border-b border-yellow-500 capitalize' key={pas} role="presentation" onClick={e => handlePASSelect(e, pas)} >{pas}</li>
                ))}
            </ul>
        )}
    </div>)
}

export default LineupStrategy