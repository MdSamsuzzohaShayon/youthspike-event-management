import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUpdateNets } from '@/redux/slices/netSlice';
import { INetBase, INetRelatives, ITeam } from '@/types';
import { EActionProcess } from '@/types/elements';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import React, { useEffect, useState } from 'react';


interface INetPointCard {
    teamA: ITeam | null | undefined;
    teamB: ITeam | null | undefined;
    net: INetRelatives | null | undefined;
    handleRightShift: () => void;
    handleLeftShift: () => void;
}

function NetPointCard({ teamA, teamB, net, handleRightShift, handleLeftShift }: INetPointCard) {
    const user = useUser();
    const dispatch = useAppDispatch();
    const currRound = useAppSelector((state)=> state.rounds.current);


    const handlePointChange = (e: React.SyntheticEvent, netId: string | undefined, teamAorB: string) => {
        /**
         * Set team a score and team b score for specific net
         */
        e.preventDefault();
        if (!netId) return;

        const inputEl = e.target as HTMLInputElement;
        const teamScore = parseInt(inputEl.value, 10);
        const updateObj = {};
        // @ts-ignore
        teamAorB === ETeam.teamA ? updateObj.teamAScore = teamScore: updateObj.teamBScore = teamScore;
        dispatch(setUpdateNets({_id: netId, ...updateObj}));

    }

    const handleKeyUp = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const inputReadonly = (teamAorB: ITeam | null | undefined, teamE: ETeam): boolean => {
        const isUserAuthorized = user && (
            user.info?.role === UserRole.admin ||
            user.info?.role === UserRole.director ||
            (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)
        );
    
        if (teamE === ETeam.teamA) {
            // @ts-ignore
            return isUserAuthorized && currRound?.teamAProcess !== EActionProcess.LOCKED;
        } else {
            // @ts-ignore
            return isUserAuthorized && currRound?.teamBProcess !== EActionProcess.LOCKED;
        }
    };
    


    return (
        <div className={`absolute z-10 h-28 w-11/12 left-2 bg-yellow-500 flex flex-col justify-around items-center 
          ${user && user.info?.captainplayer === teamA?.captain?._id ? "flex-col" : "flex-col-reverse"}`} style={{ top: '39%' }}>
            <div className="score-card-in-net w-full text-center">
                <input type="number" value={net?.teamAScore ?? '0'}
                    readOnly={inputReadonly(teamA, ETeam.teamA)}
                    onChange={(e) => handlePointChange(e, net?._id, ETeam.teamA)}
                    className='w-4/6 bg-gray-100 text-gray-900 p-1 text-center outline-none' />
            </div>
            <div className="net-card flex justify-around w-full">
                <img src="/icons/right-arrow.svg" alt="right-arrow" onKeyUp={handleKeyUp} onClick={handleRightShift} role="presentation" className="w-4 h-4 svg-white" style={{ transform: 'scaleX(-1)' }} />
                <h3>Net {net?.num}</h3>
                <img src="/icons/right-arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4 h-4 svg-white" />
            </div>
            <div className="score-card-in-net w-full text-center">
                <input type="number" value={net?.teamBScore ?? '0'}
                    onChange={(e) => handlePointChange(e, net?._id, ETeam.teamB)}
                    className='w-4/6 bg-gray-100 text-gray-900 p-1 text-center outline-none' readOnly={inputReadonly(teamB, ETeam.teamB)} />
            </div>
        </div>
    )
}

export default NetPointCard;