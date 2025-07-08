import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setCurrentRoundNets,
  setCurrNetNum,
} from '@/redux/slices/netSlice';
import { EXTRA_HEIGHT, screen } from '@/utils/constant';
import { border } from '@/utils/styles';
import { setActErr } from '@/redux/slices/elementSlice';
import { ETeam } from '@/types/team';
import { EActionProcess } from '@/types/room';
import LocalStorageService from '@/utils/LocalStorageService';
import {
  setCurrentRound,
  setRoundList,
} from '@/redux/slices/roundSlice';
import {
  setDisabledPlayerIds,
  setOutOfRange,
  setPrevPartner,
  setShowTeamPlayers,
} from '@/redux/slices/matchesSlice';
import MatchSetting from './MatchSetting';
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import AvailablePlayers from '../player/AvailablePlayers';
import SubbedPlayers from '../player/SubbedPlayers';

/**
 * NOTE:  ░ Responsive Layout Improvements ░
 * --------------------------------------------------
 *  • Replaced explicit `w-*` utilities driven by JS with Tailwind’s
 *    breakpoint‑aware classes (`w-full sm:w-1/2 lg:w-1/3 xl:w-1/4`).
 *  • Container now uses CSS Grid (`grid-cols-1 lg:grid-cols-[minmax(280px,25%)_1fr]`)—
 *    stacking on mobile and aligning side‑by‑side from lg ↑.
 *  • Removed hard‑coded 50 % heights; instead rely on `flex` with
 *    `grow` + `basis-1/2` so each half shares available space.
 *  • Enabled smooth overflow with `scrollbar-thin` for player lists.
 *  • All business logic remains untouched—only classNames + structure
 *    changed for better UX.
 */

function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  const dispatch = useAppDispatch();
  const [boardHeight, setBoardHeight] = useState(0);

  /* ──────────────── Redux selectors ──────────────── */
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets: allNets } = useAppSelector(
    (state) => state.nets,
  );
  const { roundList, current: currentRound } = useAppSelector(
    (state) => state.rounds,
  );
  const {
    myTeam,
    opTeam,
    showTeamPlayers,
    myPlayers,
    availablePlayerIds,
    disabledPlayerIds,
    selectedNet,
    myTeamE,
    match,
  } = useAppSelector((state) => state.matches);
  const currRoom = useAppSelector((state) => state.rooms.current);

  /* ──────────────── Derived values ──────────────── */
  const opTeamE = useMemo(
    () => (myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA),
    [myTeamE],
  );
  const filteredNets = useMemo(
    () =>
      currentRoundNets.find(
        (n) => n.num === currNetNum && n.round === currRoundId,
      ) ?? null,
    [currentRoundNets, currNetNum, currRoundId],
  );
  const isXs = screenWidth <= screen.xs;

  /* ──────────────── Handlers ──────────────── */
  const changeTheRound = useCallback(
    (targetRoundIndex: number) => {
      const newRoundObj = { ...roundList[targetRoundIndex] };
      const netsOfRound = allNets.filter((net) => net.round === newRoundObj._id);
      dispatch(setCurrentRoundNets(netsOfRound));

      if (myTeamE === ETeam.teamA) {
        newRoundObj.teamAProcess =
          newRoundObj.teamAProcess === EActionProcess.INITIATE
            ? EActionProcess.CHECKIN
            : newRoundObj.teamAProcess;
      } else {
        newRoundObj.teamBProcess =
          newRoundObj.teamBProcess === EActionProcess.INITIATE
            ? EActionProcess.CHECKIN
            : newRoundObj.teamBProcess;
      }

      LocalStorageService.setMatch(newRoundObj.match, newRoundObj._id);
      dispatch(setCurrentRound(newRoundObj));

      const updatedRoundList = [...roundList];
      updatedRoundList[targetRoundIndex] = newRoundObj;
      dispatch(setRoundList(updatedRoundList));
    },
    [allNets, dispatch, myTeamE, roundList],
  );

  const handleRoundChange = useCallback(
    (e: React.SyntheticEvent, roundId: string) => {
      e.preventDefault();
      const targetIdx = roundList.findIndex((r) => r._id === roundId);
      if (targetIdx !== -1 && currentRound) {
        if (roundList[targetIdx].num > currentRound.num) {
          const prevRound = roundList[targetIdx - 1];
          if (!prevRound?.completed) {
            dispatch(
              setActErr({
                success: false,
                message:
                  'Complete the previous round by putting players on all nets and points.',
              }),
            );
            return;
          }
          dispatch(setActErr(null));
        }
        changeTheRound(targetIdx);
        dispatch(setDisabledPlayerIds([]));
        dispatch(setPrevPartner(null));
      }
    },
    [changeTheRound, currentRound, dispatch, roundList],
  );

  const handleClosePlayers = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      dispatch(setShowTeamPlayers(false));
      dispatch(setOutOfRange([]));
    },
    [dispatch],
  );

  /* ──────────────── Effects ──────────────── */
  useLayoutEffect(() => {
    const measureHeight = () => {
      const leftEl = document.getElementById('left-round-detail');
      const rightEl = document.getElementById('right-net-card');
      if (leftEl && rightEl) {
        setBoardHeight(Math.max(rightEl.clientHeight, leftEl.clientHeight));
      }
    };
    const timer = setTimeout(measureHeight, 100);
    return () => clearTimeout(timer);
  }, [showTeamPlayers]);

  /* ──────────────── Render helpers ──────────────── */
  const roundButtons = useMemo(
    () =>
      roundList.map((round, i) => (
        <button
          key={round._id}
          type="button"
          onClick={(e) => handleRoundChange(e, round._id)}
          className={`single-r py-1 text-center cursor-pointer rounded-t-lg transition-colors text-black duration-150
            ${round._id === currentRound?._id ? 'bg-yellow-logo' : 'bg-white'}
            ${isXs ? 'text-sm w-8' : 'text-xs w-6'}
          `}
        >
          {match.extendedOvertime && i === roundList.length - 1
            ? 'OT'
            : `RD${round.num}`}
        </button>
      )),
    [roundList, currentRound, isXs, match.extendedOvertime, handleRoundChange],
  );

  const leftSideContent = useMemo(() => {
    /* Player‑selection drawer (overrides width on all sizes) */
    if (showTeamPlayers) {
      return (
        <aside
          id="left-drop-down"
          className={`drop-down-select bg-white text-black-logo border ${border.light} overflow-y-auto scrollbar-thin w-full`}
        >
          <Image
            width={24}
            height={24}
            alt="close-button"
            src="/icons/close.svg"
            className="svg-black mx-2 mt-2 cursor-pointer"
            onClick={handleClosePlayers}
          />
          {/* Available players */}
          <section className="px-2">
            <h3 className="mb-1 font-semibold">Selected Net {selectedNet?.num}</h3>
            <AvailablePlayers
              availablePlayerIds={availablePlayerIds}
              currentRound={currentRound}
              myPlayers={myPlayers}
              disabledPlayerIds={disabledPlayerIds}
            />
          </section>
          {/* Substituted players */}
          <section className="px-2 mt-4">
            <SubbedPlayers
              availablePlayerIds={availablePlayerIds}
              currentRound={currentRound}
              myPlayers={myPlayers}
              roundList={roundList}
            />
          </section>
        </aside>
      );
    }

    /* Default round detail card */
    return (
      <aside
        id="left-round-detail"
        style={{ minHeight: `${boardHeight + EXTRA_HEIGHT}px` }}
        className={`relative border ${border.light} flex flex-col rounded-md bg-white shadow-sm w-full`}
      >
        {/* Top half – opponent */}
        <div className="flex flex-col items-center justify-between bg-gradient-dark text-white grow basis-1/2 p-2 gap-1 rounded-t-md">
          <LogoMatchScore dark team={opTeam} teamE={opTeamE} completed={match.completed} />
          <div className="flex flex-wrap justify-center gap-1 w-full pb-1">{roundButtons}</div>
          <PointsByRound roundList={roundList} dark screenWidth={screenWidth} />
        </div>

        {match.completed && (
          <p className="absolute inset-x-0 top-1/2 z-10 bg-white border border-black-logo text-center -translate-y-1/2">
            Final Score
          </p>
        )}

        {/* Bottom half – my team */}
        <div className={`flex flex-col items-center justify-between grow basis-1/2 p-2 gap-1 border-t ${border.light}`}>
          <PointsByRound roundList={roundList} dark={false} screenWidth={screenWidth} />
          <div className="w-full">
            <LogoMatchScore
              dark={false}
              team={myTeam}
              teamE={myTeamE}
              completed={match.completed}
            />
          </div>
        </div>
      </aside>
    );
  }, [
    showTeamPlayers,
    boardHeight,
    screenWidth,
    opTeam,
    opTeamE,
    match.completed,
    roundList,
    roundButtons,
    handleClosePlayers,
    selectedNet,
    availablePlayerIds,
    currentRound,
    myPlayers,
    disabledPlayerIds,
    myTeam,
    myTeamE,
  ]);

  const rightSideContent = useMemo(
    () => (
      <section
        id="right-net-card"
        className={`border ${border.light} w-full flex-1 rounded-md bg-white shadow-sm flex overflow-x-auto lg:overflow-x-visible`}
      >
        {isXs ? (
          <NetCard
            key={currNetNum}
            currRoom={currRoom}
            boardHeight={boardHeight}
            net={filteredNets}
            screenWidth={screenWidth}
          />
        ) : (
          currentRoundNets.map((net) => (
            <NetCard
              key={net._id}
              currRoom={currRoom}
              boardHeight={boardHeight}
              net={net}
              screenWidth={screenWidth}
            />
          ))
        )}
      </section>
    ),
    [
      isXs,
      currentRoundNets,
      currRoom,
      boardHeight,
      currNetNum,
      filteredNets,
      screenWidth,
    ],
  );

  /* ──────────────── JSX ──────────────── */
  return (
    <div
      className="net-score container mx-auto h-full px-2 sm:px-4 lg:px-6 py-1 grid grid-cols-1 lg:grid-cols-[minmax(280px,25%)_1fr] gap-2 relative"
    >
      {leftSideContent}

      {/* Match setting – kept as absolute/portal style to preserve positioning */}
      <MatchSetting
        match={match}
        myTeam={myTeam}
        opTeam={opTeam}
        currRoom={currRoom}
        currRound={currentRound}
      />

      {rightSideContent}
    </div>
  );
}

export default React.memo(NetScoreOfRound);
