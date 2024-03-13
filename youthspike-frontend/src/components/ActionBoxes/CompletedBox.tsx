import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { changeTheRound, lineupToUpdatePoints, updateMultiplePoints } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';
import PointText from './PointText';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';
import { setActErr } from '@/redux/slices/elementSlice';
import { setDisabledPlayerIds, setPrevPartner } from '@/redux/slices/matchesSlice';

interface IBoxProps {
    currRoom: IRoom | null;
    socket: Socket | null;
}

function CompletedBox({ currRoom, socket }: IBoxProps) {

    // ===== Hooks =====
    const dispatch = useAppDispatch();

    // ===== Redux State =====
    const [teamAPoints, setTeamAPoints] = useState<number>(0);
    const [teamBPoints, setTeamBPoints] = useState<number>(0);


    // ===== Redux State =====
    const { myTeamE, } = useAppSelector((state) => state.matches)
    const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
    const { current: currentRound, roundList, } = useAppSelector((state) => state.rounds);
    const { teamA, teamB } = useAppSelector((state) => state.teams);

    const handleNextRound = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!currentRound?.num) return;
        let next = false;
        let targetRoundIndex = roundList.findIndex((r) => r.num === currentRound?.num + 1);
        if (targetRoundIndex !== -1 && currentRound) {
            if (roundList[targetRoundIndex].num > currentRound?.num) {
                next = true;
                const prevRound = roundList[targetRoundIndex - 1];
                if (!prevRound || !prevRound.completed) return dispatch(setActErr({ name: "Incomplete round!", message: "Make sure you have completed this round by putting players on all of the nets and points." }));
                dispatch(setActErr(null));
            }

            changeTheRound({ roundList, dispatch, allNets, newRoundIndex: targetRoundIndex, myTeamE });
            dispatch(setDisabledPlayerIds([]));
            dispatch(setPrevPartner(null));
        }
    }

    const handleUpdatePoints = (e: React.SyntheticEvent) => {
        e.preventDefault();
        // =====  Update round and nets ===== 
        updateMultiplePoints({ allNets, socket, currRoom, currRound: currentRound, currRoundNets, dispatch });
    }

    useEffect(() => {
        let tap = 0, tbp = 0;
        for (let i = 0; i < currRoundNets.length; i++) {
            // @ts-ignore
            if (currRoundNets[i].teamAScore > currRoundNets[i].teamBScore) {
                tap += 1;
            } else {
                tbp += 1;
            }
        }
        setTeamAPoints(tap);
        setTeamBPoints(tbp);
    }, [currRoundNets]);


    return (
        <div className={`flex py-2 w-full justify-between items-end gap-1 box-gradient`}>
            <div className="w-2/6 md:w-1/6 flex justify-center items-center flex-col">
                {teamA?.logo ? <AdvancedImage cldImg={cld.image(teamA.logo)} className="w-20 h-20" /> : <TextImg fullText={teamA?.name} className="w-20 h-20" />}
                <h2>{teamA?.name}</h2>
                <div className="h-24 w-24 bg-gray-100 text-gray-900 rounded-lg flex justify-center items-center">
                    <h2>{teamAPoints}</h2>
                </div>
            </div>

            <div className="w-2/6 md:hidden">
                <button className={`btn-light`} type='button' >Update Score</button>
                <button className={`btn-light`} type='button' onClick={handleNextRound} >Next Round</button>
            </div>
            <div className="w-1/6 hidden md:block">
                <button className={`btn-light`} type='button' >Update Score</button>
            </div>
            <div className="w-2/6 hidden md:block">
                <h2 className="text-center">{`Round ${currentRound?.num} - Finished`}</h2>
                <img src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
            </div>
            <div className="w-1/6 hidden md:block">
                <button className={`btn-light`} type='button' onClick={handleNextRound} >Next Round</button>
            </div>

            <div className="w-2/6 md:w-1/6 flex justify-center items-center flex-col">
                {teamB?.logo ? <AdvancedImage cldImg={cld.image(teamB.logo)} className="w-20 h-20" /> : <TextImg fullText={teamB?.name} className="w-20 h-20" />}
                <h2>{teamB?.name}</h2>
                <div className="h-24 w-24 bg-gray-100 text-gray-900 rounded-lg flex justify-center items-center">
                    <h2>{teamBPoints}</h2>
                </div>
            </div>

        </div>
    )
}

export default CompletedBox;