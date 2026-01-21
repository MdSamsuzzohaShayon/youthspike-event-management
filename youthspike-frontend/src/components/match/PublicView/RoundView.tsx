import {
  ENDirection,
  EView,
  IMatch,
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import React, { useCallback, useMemo } from "react";
import "./RoundView.css";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import ScoreBox from "./ScoreBox";
import NetInRound from "./NetInRound";
import RoundSelector from "./RoundSelector";

interface IProps {
  roundList: IRoundRelatives[];
  allNets: INetRelatives[];
  match: IMatchExpRel;
  currRound: IRoundRelatives | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  srMap: Map<string, IServerReceiverOnNetMixed>;
  matchId: string;
  view: EView;
  playerMap: Map<string, IPlayer>;
  playMapByNet: Map<string, IServerReceiverSinglePlay[]>;
  isExpandedMode: boolean;
}

const RoundView = ({
  roundList,
  allNets,
  currRound,
  match,
  teamA,
  teamB,
  setView,
  srMap,
  matchId,
  view,
  playerMap,
  playMapByNet,
  isExpandedMode
}: IProps) => {
  const dispatch = useAppDispatch();

  const matchScore = useAppSelector(
    (state) => state.matches.matchScore
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
    <div className={`${isExpandedMode ? "round-view-expanded" : "round-view" } w-full`}>
      <div className="round-selector w-full">
        <RoundSelector
          currRound={currRound}
          handleRoundChange={handleRoundChange}
        />
      </div>
      {/* Show team score here only for portrait  */}
      <div className="team-score-poietrat flex justify-center items-center gap-4">
        <ScoreBox
          teamId={teamA?._id || ""}
          name={teamA?.name || ""}
          teamLogo={teamA?.logo || null}
          score={matchScore.teamAMScore}
          penalty={match?.teamAP || 0}
        />
        <ScoreBox
          teamId={teamB?._id || ""}
          name={teamB?.name || ""}
          teamLogo={teamB?.logo || null}
          score={matchScore.teamBMScore}
          penalty={match?.teamBP || 0}
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
      <div className="one-nets-row w-full flex justify-around items-center gap-3 md:gap-4">
        <div className="team-score">
          <ScoreBox
            teamId={teamA?._id || ""}
            name={teamA?.name || ""}
            teamLogo={teamA?.logo || null}
            score={matchScore.teamAMScore}
            penalty={match?.teamAP || 0}
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
            teamId={teamB?._id || ""}
            name={teamB?.name || ""}
            teamLogo={teamB?.logo || null}
            score={matchScore.teamBMScore}
            penalty={match?.teamBP || 0}
          />
        </div>
      </div>

      {restNets && restNets.length > 0 && (
        <div className="res-of-the-nets w-full flex justify-center items-center gap-3 md:gap-4 mt-4">
          {restNets.map((n) => (
            <div className="net-in-round" key={n._id}>
              <NetInRound
                net={n}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default RoundView;
