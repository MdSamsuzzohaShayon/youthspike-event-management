import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { changeTheRound } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { setActErr } from '@/redux/slices/elementSlice';
import { setDisabledPlayerIds, setPrevPartner } from '@/redux/slices/matchesSlice';
import Image from 'next/image';
import TextImg from '../elements/TextImg';

function CompletedBox() {
  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Redux State =====
  const [teamAPoints, setTeamAPoints] = useState<number>(0);
  const [teamBPoints, setTeamBPoints] = useState<number>(0);

  // ===== Redux State =====
  const { myTeamE } = useAppSelector((state) => state.matches);
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  const handleNextRound = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currentRound?.num) return;
    const targetRoundIndex = roundList.findIndex((r) => r.num === (currentRound?.num || 0) + 1);
    if (targetRoundIndex !== -1 && currentRound) {
      if (roundList[targetRoundIndex].num > currentRound?.num) {
        const prevRound = roundList[targetRoundIndex - 1];
        if (!prevRound || !prevRound.completed) {
          dispatch(setActErr({ name: 'Incomplete round!', message: 'Make sure you have completed this round by putting players on all of the nets and points.' }));
          return;
        }
        dispatch(setActErr(null));
      }

      changeTheRound({ roundList, dispatch, allNets, newRoundIndex: targetRoundIndex, myTeamE });
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
    }
  };

  useEffect(() => {
    let tap = 0;
    let tbp = 0;
    for (let i = 0; i < currRoundNets.length; i += 1) {
      // @ts-ignore
      if (currRoundNets[i].teamAScore > currRoundNets[i].teamBScore) {
        tap += currRoundNets[i].points;
      } else {
        tbp += currRoundNets[i].points;
      }
    }
    setTeamAPoints(tap);
    setTeamBPoints(tbp);
  }, [currRoundNets]);

  return (
    <div className="flex py-2 w-full justify-between items-end gap-1 box-gradient">
      <div className="w-2/6 md:w-1/6 flex justify-center items-center flex-col">
        {teamA?.logo ? <AdvancedImage cldImg={cld.image(teamA.logo)} className="h-20" /> : <TextImg fullText={teamA?.name} className="h-20" />}
        <h2>{teamA?.name}</h2>
        <div className="h-24 w-24 bg-gray-100 text-gray-900 rounded-lg flex justify-center items-center">
          <h2>{teamAPoints}</h2>
        </div>
      </div>

      <div className="w-2/6 md:hidden">
        <button className="btn-light" type="button" onClick={handleNextRound}>
          Next Round
        </button>
      </div>
      <div className="w-2/6 hidden md:block">
        <h2 className="text-center">{`Round ${currentRound?.num} - Finished`}</h2>
        <Image src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" height={30} width={30} />
      </div>
      <div className="w-1/6 hidden md:block">
        <button className="btn-light" type="button" onClick={handleNextRound}>
          Next Round
        </button>
      </div>

      <div className="w-2/6 md:w-1/6 flex justify-center items-center flex-col">
        {teamB?.logo ? (
          <div className="advanced-img w-20">
            <AdvancedImage cldImg={cld.image(teamB.logo)} className="w-full" />
          </div>
        ) : (
          <TextImg fullText={teamB?.name} className="w-20 h-20" />
        )}
        <h2>{teamB?.name}</h2>
        <div className="h-24 w-24 bg-gray-100 text-gray-900 rounded-lg flex justify-center items-center">
          <h2>{teamBPoints}</h2>
        </div>
      </div>
    </div>
  );
}

export default CompletedBox;
