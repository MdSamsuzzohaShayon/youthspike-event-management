import React, { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum } from '@/redux/slices/netSlice';

// Utils
import { EXTRA_HEIGHT, screen } from '@/utils/constant';

// Components
import { IPlayer } from '@/types';
import { setDisabledPlayerIds, setOutOfRange, setPrevPartner, setShowTeamPlayers } from '@/redux/slices/matchesSlice';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import updateSubbedPlayer from '@/utils/requestHandlers/updateSubbedPlayer';
import { changeTheRound } from '@/utils/match/emitSocketEvents';
import { useMutation } from '@apollo/client';
import { UPDATE_ROUND } from '@/graphql/round';
import { border } from '@/utils/styles';
import { setActErr } from '@/redux/slices/elementSlice';
import MatchSetting from './MatchSetting';
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import AvailablePlayers from '../player/AvailablePlayers';

function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  const dispatch = useAppDispatch();

  const [boardHeight, setBoardHeight] = useState<number>(0);

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam, showTeamPlayers, myPlayers, availablePlayerIds, disabledPlayerIds, selectedNet, myTeamE, opTeamE, match } =
    useAppSelector((state) => state.matches);

  const [mutateRound] = useMutation(UPDATE_ROUND);

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

      changeTheRound({ roundList, dispatch, allNets, newRoundIndex: targetRoundIndex, myTeamE });
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
    }
  };




  const handleClosePlayers = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  };

  const handleRemoveSubb = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    await updateSubbedPlayer({
      currRound: currentRound,
      dispatch,
      mutateRound,
      playerId,
      roundList,
    });
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

  

  const renderSubbedPlayers = (): React.ReactNode => {
    const playerListEl: React.ReactNode[] = [];
    const teamPlayerList: IPlayer[] = myPlayers.slice();

    const subbedPlayers = currentRound?.subs ?? [];

    for (let i = 0; i < teamPlayerList.length; i += 1) {
      // Inactive players should not be shown
      if (availablePlayerIds.includes(teamPlayerList[i]._id) && subbedPlayers.includes(teamPlayerList[i]._id)) {
        playerListEl.push(
          <div key={i} className="border-b border-gray-300 flex justify-between items-center w-full cursor-pointer bg-transparent">
            <div className="advanced-img w-10 h-10 rounded-full border-2 border-black-logo overflow-hidden">
              {teamPlayerList[i].profile ? (
                <AdvancedImage cldImg={cld.image(teamPlayerList[i].profile?.toString())} className="w-full overflow-hidden" />
              ) : (
                <Image width={24} height={24} src="/icons/sports-man.svg" alt="sports-man" className="svg-black w-full" />
              )}
            </div>
            <p className="w-7/12 words-break capitalize">
              {teamPlayerList[i].firstName} {teamPlayerList[i].lastName}
            </p>
            <div className="w-1/12">
              <Image width={16} height={16} alt="close-button" src="/icons/close.svg" className="svg-black" role="presentation" onClick={(e) => handleRemoveSubb(e, teamPlayerList[i]._id)} />
            </div>
          </div>,
        );
      }
    }

    if (playerListEl.length <= 0) return null;
    return (
      <div className="player-list mt-4 w-full flex flex-col gap-1">
        <h3>Subbed Players</h3>
        {playerListEl}
      </div>
    );
  };

  return (
    <div className="net-score h-full container px-4 mx-auto flex justify-between gap-1 text relative mt-4">
      {/* Left side round detail start  */}
      {!showTeamPlayers ? (
        <div id="left-round-detail" className={`round-detail border ${border.light} ${screenWidth > screen.xs ? 'w-3/12' : 'w-3/6'}`}>
          {/* Top Side Start  */}
          <div id="left-top" style={{ minHeight: `${boardHeight / 2 + EXTRA_HEIGHT / 2}px` }} className="round-top w-full bg-gradient-dark px-2 flex flex-col items-center justify-between">
            <LogoMatchScore dark team={opTeam} teamE={opTeamE} screenWidth={screenWidth} completed={match.completed} />

            <div className="round-nums flex flex-wrap w-full justify-center gap-1 items-center">
              {roundList.map((round) => (
                <button
                  className={`single-r ${round._id === currentRound?._id ? 'bg-yellow-400' : 'bg-white'} py-1 text-center cursor-pointer ${
                    screenWidth > screen.xs ? 'text-xs w-6' : 'text-sm w-8'
                  } rounded-t-lg`}
                  type="button"
                  onClick={(e) => handleRoundChange(e, round._id)}
                  key={round._id}
                >
                  RD{round.num}
                </button>
              ))}
            </div>
            <PointsByRound roundList={roundList} dark screenWidth={screenWidth} />
          </div>
          {/* Top Side End  */}

          {/* Bottom Side Start  */}
          <div
            id="left-bottom"
            style={{ minHeight: `${boardHeight / 2 + EXTRA_HEIGHT / 2}px` }}
            className={`round-bottom w-full border ${border.light} px-2 flex flex-col items-center justify-between`}
          >
            <PointsByRound roundList={roundList} dark={false} screenWidth={screenWidth} />
            <div className="mb-2 w-full">
              <LogoMatchScore dark={false} team={myTeam} teamE={myTeamE} screenWidth={screenWidth} completed={match.completed} />
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
            {renderSubbedPlayers()}
          </div>
        </div>
      )}
      {/* Left side round detail end  */}

      {/* Setting start  */}
      <MatchSetting match={match} myTeam={myTeam} opTeam={opTeam} />
      {/* Setting end  */}

      {/* Right side net detail start */}
      <div id="right-net-card" className={`right-side net-card-wrapper border ${border.light} flex ${screenWidth > screen.xs ? 'w-9/12' : 'w-3/6'}`}>
        {screenWidth > screen.xs ? (
          currentRoundNets.map((net) => <NetCard boardHeight={boardHeight} key={net._id} net={net} screenWidth={screenWidth} />)
        ) : (
          <NetCard boardHeight={boardHeight} net={currentRoundNets.find((n) => n.num === currNetNum && n.round === currRoundId) ?? null} screenWidth={screenWidth} />
        )}
      </div>
      {/* Right side net detail end */}
    </div>
  );
}

export default NetScoreOfRound;
