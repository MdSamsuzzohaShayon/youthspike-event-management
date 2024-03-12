import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { canGoNextOrPrevRound, changeTheRound, lineupToUpdatePoints, updateMultiplePoints } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';
import PointText from './PointText';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';

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

    const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
        e.preventDefault();
        /**
         * Before completing current round someone can not go to the next round
         * Round must have team a score and team b score to proceed
         * Change current round nets
         */
        const newRoundIndex = canGoNextOrPrevRound({ currRound: currentRound, roundList, next, currRoundNets, dispatch });
        if (newRoundIndex !== -1) {
            changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex, myTeamE, currRound: currentRound });
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
                <button className={`btn-light`} type='button' >Next Round</button>
            </div>
            <div className="w-1/6 hidden md:block">
                <button className={`btn-light`} type='button' >Update Score</button>
            </div>
            <div className="w-2/6 hidden md:block">
                <h2 className="text-center">{`Round ${currentRound?.num} - Finished`}</h2>
                <img src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
            </div>
            <div className="w-1/6 hidden md:block">
                <button className={`btn-light`} type='button' >Next Round</button>
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