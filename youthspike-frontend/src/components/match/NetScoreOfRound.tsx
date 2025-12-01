import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { EXTRA_HEIGHT, screen } from "@/utils/constant";
import { border } from "@/utils/styles";
import { ETeam } from "@/types/team";
import { setOutOfRange, setShowTeamPlayers } from "@/redux/slices/matchesSlice";
import MatchSetting from "./MatchSetting";
import LogoMatchScore from "./LogoMatchScore";
import PointsByRound from "./PointsByRound";
import NetCard from "./NetCard";
import AvailablePlayers from "../player/AvailablePlayers";
import { setMessage } from "@/redux/slices/elementSlice";
import { EMessage, INetRelatives } from "@/types";
import { useRoundNavigation } from "@/hooks/useRoundNavigation";

function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  const dispatch = useAppDispatch();
  const [boardHeight, setBoardHeight] = useState(600);

  // Redux selectors
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const {
    currNetNum,
    currentRoundNets,
    nets: allNets,
  } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector(
    (state) => state.rounds
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

  // Memoized values
  const opTeamE = useMemo(
    () => (myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA),
    [myTeamE]
  );
  const filteredNets = useMemo(
    () =>
      currentRoundNets.find(
        (n) => n.num === currNetNum && n.round === currRoundId
      ) ?? null,
    [currentRoundNets, currNetNum, currRoundId]
  );

  // Precompute lookups for faster access

  const netsByRound = useMemo(() => {
    const map: Record<string, INetRelatives[]> = {};
    allNets.forEach((net) => {
      if (!map[net.round]) map[net.round] = [];
      map[net.round].push(net);
    });
    return map;
  }, [allNets]);

  const { handleRoundChange } = useRoundNavigation({
    roundList,
    netsByRound,
    myTeamE,
    currentRound,
    match,
  });

  // Simplified event handler using the hook
  const handleRoundChangeClick = useCallback(
    (e: React.SyntheticEvent, roundId: string) => {
      e.preventDefault();

      handleRoundChange(roundId, (errorMessage) => {
        dispatch(
          setMessage({
            type: EMessage.ERROR,
            message: errorMessage,
          })
        );
      });

      dispatch(setMessage(null));
    },
    [dispatch, handleRoundChange, match]
  );

  const handleClosePlayers = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      dispatch(setShowTeamPlayers(false));
      dispatch(setOutOfRange([]));
    },
    [dispatch]
  );

  // Memoized components
  const roundButtons = useMemo(
    () =>
      roundList.map((round, i) => (
        <button
          key={round._id}
          className={`single-r ${
            round._id === currentRound?._id ? "bg-yellow-logo" : "bg-white"
          } py-1 text-center cursor-pointer ${
            screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"
          } rounded-t-lg`}
          type="button"
          onClick={(e) => handleRoundChangeClick(e, round._id)}
        >
          {match.extendedOvertime && i === roundList.length - 1
            ? "OT"
            : `RD${round.num}`}
        </button>
      )),
    [
      roundList,
      currentRound,
      screenWidth,
      match.extendedOvertime,
      handleRoundChangeClick,
    ]
  );

  const leftSideContent = useMemo(() => {
    if (showTeamPlayers) {
      return (
        <div
          id="left-drop-down"
          className={`drop-down-select w-3/6 overflow-y-scroll text-black-logo bg-white border ${border.light}`}
        >
          <Image
            width={24}
            height={24}
            alt="close-button"
            src="/icons/close.svg"
            className="svg-black mx-2 mt-2 cursor-pointer"
            onClick={handleClosePlayers}
          />
          <div className="px-2 w-full" style={{ minHeight: "fit-content" }}>
            <h3>Selected Net {selectedNet?.num}</h3>
            <AvailablePlayers
              availablePlayerIds={availablePlayerIds}
              currentRound={currentRound}
              myPlayers={myPlayers}
              disabledPlayerIds={disabledPlayerIds}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        id="left-round-detail"
        style={{
          minHeight: `${
            (screenWidth > screen.xs ? 600 : 450) + EXTRA_HEIGHT
          }px`,
        }}
        className={`round-detail relative border ${border.light} ${
          screenWidth > screen.xs ? "w-3/12" : "w-3/6"
        }`}
      >
        <div
          id="left-top"
          style={{ height: "50%" }}
          className="round-top w-full bg-gradient-dark px-2 flex flex-col items-center justify-between"
        >
          <LogoMatchScore
            dark
            team={opTeam}
            teamE={opTeamE}
            completed={match.completed}
            penalty={
              opTeamE === ETeam.teamA ? match.teamAP || 0 : match.teamBP || 0
            }
          />
          <div className="round-nums flex flex-wrap w-full justify-center gap-1 items-center">
            {Boolean(match.teamAP) && Boolean(match.teamAP) && (
              <button
                className={`single-r bg-white py-1 text-center cursor-pointer ${
                  screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"
                } rounded-t-lg`}
                type="button"
                onClick={(e) => e.preventDefault()}
              >
                PT
              </button>
            )}
            {roundButtons}
          </div>
          <PointsByRound
            roundList={roundList}
            dark
            screenWidth={screenWidth}
            currMatch={match}
          />
        </div>

        {match.completed && (
          <p
            className="absolute w-full top-1/2 z-10 bg-white border border-black-logo text-center"
            style={{ transform: "translate(0%, -50%)" }}
          >
            Final Score
          </p>
        )}

        <div
          id="left-bottom"
          style={{ height: "50%" }}
          className={`round-bottom w-full border ${border.light} px-2 flex flex-col items-center justify-between`}
        >
          <PointsByRound
            roundList={roundList}
            dark={false}
            screenWidth={screenWidth}
            currMatch={match}
          />
          <div className="mb-2 w-full">
            <LogoMatchScore
              dark={false}
              team={myTeam}
              teamE={myTeamE}
              completed={match.completed}
              penalty={
                myTeamE === ETeam.teamA ? match.teamAP || 0 : match.teamBP || 0
              }
            />
          </div>
        </div>
      </div>
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
      <div
        id="right-net-card"
        className={`right-side net-card-wrapper border ${border.light} flex ${
          screenWidth > screen.xs ? "w-9/12" : "w-3/6"
        }`}
      >
        {screenWidth > screen.xs ? (
          currentRoundNets.map((net) => (
            <NetCard
              key={net._id}
              currRoom={currRoom}
              boardHeight={boardHeight}
              net={net}
              screenWidth={screenWidth}
            />
          ))
        ) : (
          <NetCard
            key={currNetNum}
            currRoom={currRoom}
            boardHeight={boardHeight}
            net={filteredNets}
            screenWidth={screenWidth}
          />
        )}
      </div>
    ),
    [
      screenWidth,
      currentRoundNets,
      currRoom,
      boardHeight,
      currNetNum,
      filteredNets,
    ]
  );

  return (
    <div className="net-score h-full container px-4 mx-auto flex justify-between gap-1 text relative">
      {leftSideContent}
      <MatchSetting
        match={match}
        myTeam={myTeam}
        opTeam={opTeam}
        currRoom={currRoom}
        currRound={currentRound}
        myTeamE={myTeamE}
      />
      {rightSideContent}
    </div>
  );
}

export default React.memo(NetScoreOfRound);
