import React, { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentRoundNets, setCurrNetNum } from '@/redux/slices/netSlice';

// Utils
import { EXTRA_HEIGHT, screen } from '@/utils/constant';

// Components
import { setDisabledPlayerIds, setOutOfRange, setPrevPartner, setShowTeamPlayers } from '@/redux/slices/matchesSlice';
import { border } from '@/utils/styles';
import { setActErr } from '@/redux/slices/elementSlice';
import { ETeam } from '@/types/team';
import { EActionProcess } from '@/types/room';
import { setMatch } from '@/utils/localStorage';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';

// Components
import MatchSetting from './MatchSetting';
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import AvailablePlayers from '../player/AvailablePlayers';
import SubbedPlayers from '../player/SubbedPlayers';

function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  const dispatch = useAppDispatch();

  const [boardHeight, setBoardHeight] = useState<number>(0);

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam, showTeamPlayers, myPlayers, availablePlayerIds, disabledPlayerIds, selectedNet, myTeamE, opTeamE, match } = useAppSelector((state) => state.matches);

  // Duplicate
  const changeTheRound = (targetRoundIndex: number) => {
    // ===== Current round, current round nets and round list properly =====
    const newRoundObj = { ...roundList[targetRoundIndex] };
    const filteredNets = allNets.filter((net) => net.round === newRoundObj._id);
    dispatch(setCurrentRoundNets(filteredNets));

    if (myTeamE === ETeam.teamA) {
      newRoundObj.teamAProcess = newRoundObj.teamAProcess && newRoundObj.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamAProcess;
    } else {
      newRoundObj.teamBProcess = newRoundObj.teamBProcess && newRoundObj.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : newRoundObj.teamBProcess;
    }
    setMatch(newRoundObj.match, newRoundObj._id);
    dispatch(setCurrentRound(newRoundObj));
    const newRoundList = roundList.filter((r) => r._id !== newRoundObj._id);
    newRoundList.push(newRoundObj);
    dispatch(setRoundList(newRoundList));
  };

  // ===== Input Round Change =====
  const handleRoundChange = (e: React.SyntheticEvent, roundId: string) => {
    e.preventDefault();
    const targetRoundIndex = roundList.findIndex((r) => r._id === roundId);
    if (targetRoundIndex !== -1 && currentRound) {
      if (roundList[targetRoundIndex].num > currentRound?.num) {
        const prevRound = roundList[targetRoundIndex - 1];
        if (!prevRound || !prevRound.completed) {
          dispatch(setActErr({ success: false, message: 'Make sure you have completed this round by putting players on all of the nets and points.' }));
          return;
        }
        dispatch(setActErr(null));
      }

      changeTheRound(targetRoundIndex);
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
    }
  };

  const handleClosePlayers = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  };

  useEffect(() => {
    if (currentRoundNets && currentRoundNets.length > 0) {
      dispatch(setCurrNetNum(currentRoundNets[0].num));
    }
  }, []);

  useLayoutEffect(() => {
    // Use layout effect to measure the element after render
    const leftFullEl = document.getElementById('left-round-detail');
    const rightFullEl = document.getElementById('right-net-card');
    if (rightFullEl && leftFullEl) {
      const fullHeight = rightFullEl.clientHeight > leftFullEl.clientHeight ? rightFullEl.clientHeight : leftFullEl.clientHeight;
      setBoardHeight(fullHeight);
    }
  }, []); // Add dependencies that might affect the height measurement

  return (
    <div className="net-score h-full container px-4 mx-auto flex justify-between gap-1 text relative">
      {/* Left side round detail start  */}
      {!showTeamPlayers ? (
        <div id="left-round-detail" style={{ minHeight: `${boardHeight + EXTRA_HEIGHT}px` }} className={`round-detail relative border ${border.light} ${screenWidth > screen.xs ? 'w-3/12' : 'w-3/6'}`}>
          {/* Top Side Start  */}
          <div id="left-top" style={{ height: '50%' }} className="round-top w-full bg-gradient-dark px-2 flex flex-col items-center justify-between">
            <LogoMatchScore dark team={opTeam} teamE={opTeamE} completed={match.completed} />

            <div className="round-nums flex flex-wrap w-full justify-center gap-1 items-center">
              {roundList.map((round, i) => (
                <button
                  className={`single-r ${round._id === currentRound?._id ? 'bg-yellow-logo' : 'bg-white'} py-1 text-center cursor-pointer ${
                    screenWidth > screen.xs ? 'text-xs w-6' : 'text-sm w-8'
                  } rounded-t-lg`}
                  type="button"
                  onClick={(e) => handleRoundChange(e, round._id)}
                  key={round._id}
                >
                  {match.extendedOvertime && i === roundList.length - 1 ? 'OT' : `RD${round.num}`}
                </button>
              ))}
            </div>
            <PointsByRound roundList={roundList} dark screenWidth={screenWidth} />
          </div>
          {/* Top Side End  */}

          {match.completed && (
            <p className="absolute w-full top-1/2 z-10 bg-white border border-black-logo text-center" style={{ transform: 'translate(0%, -50%)' }}>
              Final Score
            </p>
          )}
          {/* Bottom Side Start  */}
          <div id="left-bottom" style={{ height: '50%' }} className={`round-bottom w-full border ${border.light} px-2 flex flex-col items-center justify-between`}>
            <PointsByRound roundList={roundList} dark={false} screenWidth={screenWidth} />
            <div className="mb-2 w-full">
              <LogoMatchScore dark={false} team={myTeam} teamE={myTeamE} completed={match.completed} />
            </div>
          </div>
          {/* Bottom Side End  */}
        </div>
      ) : (
        <div id="left-drop-down" className={`drop-down-select w-3/6 overflow-y-scroll text-black-logo bg-white border ${border.light}`}>
          <Image width={24} height={24} alt="close-button" src="/icons/close.svg" className="svg-black mx-2 mt-2" role="presentation" onClick={handleClosePlayers} />
          <div className="px-2 w-full" style={{ minHeight: 'fit-content' }}>
            <h3>Selected Net {selectedNet?.num}</h3>
            <AvailablePlayers availablePlayerIds={availablePlayerIds} currentRound={currentRound} myPlayers={myPlayers} disabledPlayerIds={disabledPlayerIds} />
          </div>

          <div className="px-2 w-full mt-4" style={{ minHeight: 'fit-content' }}>
            <SubbedPlayers availablePlayerIds={availablePlayerIds} currentRound={currentRound} myPlayers={myPlayers} roundList={roundList} />
          </div>
        </div>
      )}
      {/* Left side round detail end  */}

      {/* Setting start  */}
      <MatchSetting match={match} myTeam={myTeam} opTeam={opTeam} />
      {/* Setting end  */}

      <div id="right-net-card" className={`right-side net-card-wrapper border ${border.light} flex ${screenWidth > screen.xs ? 'w-9/12' : 'w-3/6'}`}>
        <AnimatePresence mode="wait">
          {screenWidth > screen.xs ? (
            currentRoundNets.map((net) => <NetCard key={net._id} boardHeight={boardHeight} net={net} screenWidth={screenWidth} />)
          ) : (
            <NetCard key={currNetNum} boardHeight={boardHeight} net={currentRoundNets.find((n) => n.num === currNetNum && n.round === currRoundId) ?? null} screenWidth={screenWidth} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default NetScoreOfRound;
