import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { INetBase, INetRelatives, INetUpdate, IRoundRelatives, ITeam } from '@/types';
import { EActionProcess, IRoom } from '@/types/room';
import { ETeam } from '@/types/team';
import { fsToggle } from '@/utils/helper';
import React, { useEffect, useState } from 'react';
import TeamScoreInput from '../team/TeamScoreInput';
import { screen } from '@/utils/constant';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { lineupToUpdatePoints } from '@/utils/match/emitSocketEvents';
import { useSocket } from '@/lib/SocketProvider';
import { ETieBreaker } from '@/types/net';


interface INetPointCard {
    teamA: ITeam | null | undefined;
    teamB: ITeam | null | undefined;
    net: INetRelatives | null | undefined;
    handleRightShift: () => void;
    handleLeftShift: () => void;
    screenWidth: number;
    currRoom: IRoom | null;
    roundList: IRoundRelatives[];
}

function NetPointCard({ net, handleRightShift, handleLeftShift, screenWidth, currRoom, roundList }: INetPointCard) {
    const user = useUser();
    const dispatch = useAppDispatch();
    const socket = useSocket();

    const { current: currRound } = useAppSelector((state) => state.rounds);
    const { nets: allNets, currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
    const teamA = useAppSelector((state) => state.teams.teamA);


    const handlePointChange = (e: React.SyntheticEvent, netId: string | undefined, teamAorB: string) => {
        /**
         * Set team a score and team b score for specific net
         */
        e.preventDefault();
        if (!netId) return;

        const inputEl = e.target as HTMLInputElement;
        if (!inputEl.value || inputEl.value === '') return;
        const teamScore = parseInt(inputEl.value, 10);
        const updateObj: { teamAScore: null | number, teamBScore: null | number } = { teamAScore: null, teamBScore: null };
        if (teamAorB === ETeam.teamA) {
            updateObj.teamAScore = teamScore;
            updateObj.teamBScore = net?.teamBScore ? net?.teamBScore : null;
        } else {
            updateObj.teamBScore = teamScore;
            updateObj.teamAScore = net?.teamAScore ? net?.teamAScore : null;
        }

        // Set current round nets and all nets
        const updatedCRN = [...currRoundNets]; // crn = current round nets
        const updatedAllNets = [...allNets];
        const findCRN = updatedCRN.findIndex((n) => n._id === netId);
        if (findCRN !== -1) updatedCRN[findCRN] = { ...updatedCRN[findCRN], ...updateObj };
        const findAN = updatedAllNets.findIndex((n) => n._id === netId);
        if (findAN !== -1) updatedAllNets[findAN] = { ...updatedAllNets[findAN], ...updateObj };
        dispatch(setCurrentRoundNets(updatedCRN));
        dispatch(setNets(updatedAllNets));

        // Update current round
        let tas: number | null = null, tbs: number | null = null;
        updatedCRN.forEach((n) => {
            if (n.teamAScore && n.teamBScore) {
                tas = tas ? tas + n.teamAScore : n.teamAScore;
                tbs = tbs ? tbs + n.teamBScore : n.teamBScore;
            } else {
                tas = null;
                tbs = null;
            }
        });

        const currRoundObj = { ...currRound, teamAScore: tas, teamBScore: tbs, completed: tas && tbs ? true : false } as IRoundRelatives;
        dispatch(setCurrentRound(currRoundObj));
        const updatedRoundList = [...roundList];
        const rI = updatedRoundList.findIndex((r) => r._id === currRound?._id);
        if (rI === -1) return;
        updatedRoundList[rI] = { ...currRoundObj };
        dispatch(setRoundList(updatedRoundList));

        // Update to the server
        lineupToUpdatePoints({ socket, currRoom, currRound: currRoundObj, currRoundNets: updatedCRN });
    }

    const handleKeyUp = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };


    const teamACapOrCo = user.info?.captainplayer === teamA?.captain?._id || user.info?.cocaptainplayer === teamA?.cocaptain?._id;

    return (
        <div className={`absolute z-10 h-28 w-11/12 left-2 bg-yellow-400 flex flex-col justify-around items-center p-1 flex-col rounded-lg`} style={{ top: '39%' }}>
            {user && teamACapOrCo
                ? <TeamScoreInput key={`${1}-${net?._id}`} currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamB} />
                : <TeamScoreInput key={`${2}-${net?._id}`} currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamA} />}
            <div className="net-card flex justify-around items-center w-full py-1">
                <img src="/icons/right-arrow.svg" alt="right-arrow" onKeyUp={handleKeyUp} onClick={handleRightShift} role="presentation" className="w-4 svg-white" style={{ transform: 'scaleX(-1)' }} />
                <div className="texts text-center">

                <h3 style={fsToggle(screenWidth)} className='leading-3'>Net {net?.num}</h3>
                {net?.netType === ETieBreaker.TIE_BREAKER_NET && <p className='w-full'>Worth 2 points</p>}
                </div>
                <img src="/icons/right-arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4  svg-white" />
            </div>
            {user && teamACapOrCo
                ? <TeamScoreInput key={`${3}-${net?._id}`} currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamA} />
                : <TeamScoreInput key={`${4}-${net?._id}`} currRound={currRound} net={net} user={user} screenWidth={screenWidth} handlePointChange={handlePointChange} teamE={ETeam.teamB} />}
        </div>
    )
}

export default NetPointCard;