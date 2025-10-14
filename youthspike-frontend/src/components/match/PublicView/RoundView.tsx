import {
  ENDirection,
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import React, { useCallback, useMemo } from "react";
import "./RoundView.css";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import ScoreBox from "./ScoreBox";
import NetInRound from "./NetInRound";
import RoundSelector from "./RoundSelector";

interface IRoundViewProps {
  roundList: IRoundRelatives[];
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  currRound: IRoundRelatives | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  srMap: Map<string, IServerReceiverOnNetMixed>;
  matchId: string;
  view: EView;
  playerMap: Map<string, IPlayer>;
  playMapByNet: Map<string, IServerReceiverSinglePlay[]>;
}

const RoundView = ({
  roundList,
  allNets,
  currRound,
  currRoundNets,
  teamA,
  teamB,
  setView,
  srMap,
  matchId,
  view,
  playerMap,
  playMapByNet,
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();

  const { teamATotalScore, teamBTotalScore } = useAppSelector(
    (state) => state.matches
  );

  const roundIdToIndex = useMemo(() => {
    const map: Record<string, number> = {};
    roundList.forEach((round, idx) => {
      map[round._id] = idx;
    });
    return map;
  }, [roundList]);

  const netsByRound = useMemo(() => {
    const map: Record<string, typeof allNets> = {};
    allNets.forEach((net) => {
      if (!map[net.round]) map[net.round] = [];
      map[net.round].push(net);
    });
    return map;
  }, [allNets]);

  const [net1, net2, net3, restNets] = useMemo(() => {
    if (!currRound) return [null, null, null, []] as const;

    const filteredNets = netsByRound?.[currRound._id] ?? [];

    const [first, second, third, ...rest] = filteredNets;

    return [first ?? null, second ?? null, third ?? null, rest ?? []] as const;
  }, [netsByRound, currRound]);

  const changeTheRound = useCallback(
    (targetRoundIndex: number) => {
      const roundObj = roundList[targetRoundIndex];
      if (!roundObj) return;

      const filteredNets = netsByRound[roundObj._id] ?? [];
      dispatch(setCurrentRoundNets(filteredNets));

      dispatch(setCurrentRound(roundObj));
      LocalStorageService.setMatch(roundObj.match, roundObj._id);

      const newRoundList = [...roundList];
      newRoundList[targetRoundIndex] = roundObj;
      dispatch(setRoundList(newRoundList));
    },
    [dispatch, netsByRound, roundList]
  );

  const handleRoundChange = useCallback(
    (direction: ENDirection) => (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!currRound) return;

      const currIdx = roundIdToIndex[currRound._id];
      let targetIdx: number;

      if (direction === ENDirection.PREV && currIdx > 0) {
        targetIdx = currIdx - 1;
      } else if (
        direction === ENDirection.NEXT &&
        currIdx < roundList.length - 1
      ) {
        targetIdx = currIdx + 1;
      } else {
        return;
      }

      changeTheRound(targetIdx);
    },
    [currRound, roundIdToIndex, roundList.length, changeTheRound]
  );

  return (
    <div className="round-view w-full">
      <div className="round-selector w-full">
        <RoundSelector
          currRound={currRound}
          handleRoundChange={handleRoundChange}
        />
      </div>
      {/* Show team score here only for portrait  */}
      <div className="team-score-poietrat flex justify-center items-center gap-4">
        <ScoreBox
          name={teamA?.name || ""}
          teamLogo={teamA?.logo || null}
          score={teamATotalScore}
        />
        <ScoreBox
          name={teamB?.name || ""}
          teamLogo={teamB?.logo || null}
          score={teamBTotalScore}
        />
      </div>

      {/* First row  */}
      <div className="two-nets-row w-full flex justify-between items-stretch flex-wrap gap-3 md:gap-4">
        {/* In this row there will be 2 nets */}
        {net1 && (
          <div className="net-in-round">
            <NetInRound
              net={net1}
              teamA={teamA}
              teamB={teamB}
              playerMap={playerMap}
              srMap={srMap}
              playMapByNet={playMapByNet}
              view={view}
              matchId={matchId}
              setView={setView}
            />
          </div>
        )}

        {net2 && (
          <div className="net-in-round">
            <NetInRound
              net={net2}
              teamA={teamA}
              teamB={teamB}
              playerMap={playerMap}
              srMap={srMap}
              playMapByNet={playMapByNet}
              view={view}
              matchId={matchId}
              setView={setView}
            />
          </div>
        )}
      </div>

      {/* Second row  */}
      <div className="one-nets-row w-full flex justify-between items-center gap-3 md:gap-4">
        <div className="team-score">
          <ScoreBox
            name={teamA?.name || ""}
            teamLogo={teamA?.logo || null}
            score={teamATotalScore}
            roundScore
          />
        </div>
        {/* In this row there will be 1 net */}
        {net3 && (
          <div className="net-in-round">
            <NetInRound
              net={net3}
              teamA={teamA}
              teamB={teamB}
              playerMap={playerMap}
              srMap={srMap}
              playMapByNet={playMapByNet}
              view={view}
              matchId={matchId}
              setView={setView}
            />
          </div>
        )}
        <div className="team-score">
          <ScoreBox
            name={teamB?.name || ""}
            teamLogo={teamB?.logo || null}
            score={teamBTotalScore}
            roundScore
          />
        </div>
      </div>
    </div>
  );
};

export default RoundView;
