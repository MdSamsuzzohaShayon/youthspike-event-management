import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUpdateNets } from '@/redux/slices/netSlice';
import { INetBase, INetRelatives, INetUpdate, ITeam } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import { fsToggle } from '@/utils/helper';
import React, { useEffect, useState } from 'react';
import TeamScoreInput from '../team/TeamScoreInput';
import { screen } from '@/utils/constant';


interface INetPointCard {
    teamA: ITeam | null | undefined;
    teamB: ITeam | null | undefined;
    net: INetRelatives | null | undefined;
    handleRightShift: () => void;
    handleLeftShift: () => void;
    screenWidth: number;
}

function NetPointCard({ net, handleRightShift, handleLeftShift, screenWidth }: INetPointCard) {
    const user = useUser();
    const dispatch = useAppDispatch();
    const { current: currRound } = useAppSelector((state) => state.rounds);
    const teamA = useAppSelector((state) => state.teams.teamA);


    const handlePointChange = (e: React.SyntheticEvent, netId: string | undefined, teamAorB: string) => {
        /**
         * Set team a score and team b score for specific net
         */
        e.preventDefault();
        if (!netId) return;

        const inputEl = e.target as HTMLInputElement;
        if (inputEl.value === '') return;
        const teamScore = parseInt(inputEl.value, 10);
        const updateObj: { teamAScore: null | number, teamBScore: null | number } = { teamAScore: null, teamBScore: null };
        if (teamAorB === ETeam.teamA) {
            updateObj.teamAScore = teamScore;
            updateObj.teamBScore = net?.teamBScore ? net?.teamBScore : null;
        } else {
            updateObj.teamBScore = teamScore;
            updateObj.teamAScore = net?.teamAScore ? net?.teamAScore : null;
        }
        dispatch(setUpdateNets({ _id: netId, ...updateObj }));

    }

    const handleKeyUp = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };


    const teamACapOrCo = user.info?.captainplayer === teamA?.captain?._id || user.info?.cocaptainplayer === teamA?.cocaptain?._id;

    return (
        <div className={`absolute z-10 ${screenWidth > screen.xs ? "h-20" : "h-28"} w-11/12 left-2 bg-yellow-500 flex flex-col justify-around items-center p-1 flex-col`} style={{ top: '39%' }}>
            {user && teamACapOrCo
                ? <TeamScoreInput currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamB} />
                : <TeamScoreInput currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamA} />}
            <div className="net-card flex justify-around items-center w-full py-1">
                <img src="/icons/right-arrow.svg" alt="right-arrow" onKeyUp={handleKeyUp} onClick={handleRightShift} role="presentation" className="w-4 svg-white" style={{ transform: 'scaleX(-1)' }} />
                <h3 style={fsToggle(screenWidth)} className='leading-3'>Net {net?.num}</h3>
                <img src="/icons/right-arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4  svg-white" />
            </div>
            {user && teamACapOrCo
                ? <TeamScoreInput currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamA} />
                : <TeamScoreInput currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamB} />}
        </div>
    )
}

export default NetPointCard;