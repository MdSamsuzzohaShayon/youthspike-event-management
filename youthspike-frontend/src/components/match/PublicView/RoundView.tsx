import {
  EArrowSize,
  ELayout,
  ENDirection,
  ETeamType,
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import React, { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import NetInRoundView from "./NetInRoundView";
import LocalStorageService from "@/utils/LocalStorageService";
import NavArrow from "./NavArrow";
import ScoreCircle from "./ScoreCircle";
import TeamInfo from "./TeamInfo";
import VSBadge from "./VSBadge";
import RoundNavigation from "./RoundNavigation";

interface IRoundViewProps {
  roundList: IRoundRelatives[];
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  currRound: IRoundRelatives | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  setView: React.Dispatch<React.SetStateAction<EView>>;
  srMap: Map<string, IServerReceiverOnNetMixed>;
  matchId: string;
  view: EView;
}

const RoundView = ({
  roundList,
  allNets,
  currRound,
  currRoundNets,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  setView,
  srMap,
  matchId,
  view,
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
    <div className="py-4 md:py-6 rounded-xl">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 md:p-8 mb-6 shadow-2xl border border-gray-700">
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center space-y-6">
          {/* Round Navigation - Mobile */}
          <div className="flex items-center justify-between w-full mb-2">
            <div className="text-yellow-logo font-bold text-lg bg-gray-900 px-4 py-2 rounded-full border border-yellow-logo shadow-md">
              Round {currRound?.num}
            </div>

            <div className="flex space-x-3">
              <NavArrow
                direction={ENDirection.PREV}
                onClick={handleRoundChange(ENDirection.PREV)}
                size={EArrowSize.SM}
                className=""
              />

              <NavArrow
                direction={ENDirection.NEXT}
                onClick={handleRoundChange(ENDirection.NEXT)}
                size={EArrowSize.SM}
                className=""
              />
            </div>
          </div>

          {/* Teams and Score - Mobile */}
          <div className="w-full rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <TeamInfo team={teamA} teamType={ETeamType.TEAM_A} />

              <div className="flex flex-col items-center mx-2">
                <VSBadge size="sm" />
                <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-yellow-logo to-transparent my-2"></div>
                <div className="text-white text-xs font-medium">VS</div>
              </div>

              <TeamInfo team={teamB} teamType={ETeamType.TEAM_B} />
            </div>

            {/* Score Display - Mobile */}
            <div className="flex items-center justify-between mt-6 px-2">
              <ScoreCircle
                score={teamATotalScore}
                teamType={ETeamType.TEAM_A}
                className="w-20 h-20  bg-yellow-logo"
              />

              <div className="flex flex-col items-center mx-2">
                <div className="text-yellow-logo text-2xl font-bold mb-1">-</div>
                <div className="text-gray-400 text-xs">SCORE</div>
              </div>

              <ScoreCircle
                score={teamBTotalScore}
                teamType={ETeamType.TEAM_B}
                className="w-20 h-20 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden flex-col items-center">
          {/* Round Navigation - Tablet */}
          <RoundNavigation
            size={EArrowSize.MD}
            currRound={currRound}
            handleRoundChange={handleRoundChange}
            className="mb-6"
          />

          {/* Teams and Score - Tablet */}
          <div className="flex items-center justify-between w-full">
            <TeamInfo
              team={teamA}
              teamType={ETeamType.TEAM_A}
              layout={ELayout.TABLET}
            />

            <div className="flex flex-col items-center mx-4">
              <div className="flex items-center">
                <ScoreCircle
                  score={teamATotalScore}
                  teamType={ETeamType.TEAM_A}
                  className="w-28 h-28 bg-yellow-logo"
                />

                <div className="mx-6 flex flex-col items-center">
                  <VSBadge size="md" />
                  <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-yellow-logo to-transparent my-3"></div>
                  <div className="text-white text-sm font-medium">VERSUS</div>
                </div>

                <ScoreCircle
                  score={teamBTotalScore}
                  teamType={ETeamType.TEAM_B}
                  className="w-28 h-28 bg-white"
                />
              </div>
            </div>

            <TeamInfo
              team={teamB}
              teamType={ETeamType.TEAM_B}
              layout={ELayout.TABLET}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="w-3/12">
            <TeamInfo
              team={teamA}
              teamType={ETeamType.TEAM_A}
              layout={ELayout.DESKTOP}
            />
          </div>

          {/* Center Content - Desktop */}
          <div className="w-6/12 flex flex-col items-center flex-1">
            <div className="flex items-center justify-center">
              <ScoreCircle
                score={teamATotalScore}
                teamType={ETeamType.TEAM_A}
                className="w-36 h-36 border-6 shadow-xl bg-yellow-logo"
              />

              <div className="flex flex-col items-center">
                <VSBadge size="lg" />
                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-logo to-transparent my-4"></div>

                <RoundNavigation
                  size={EArrowSize.LG}
                  currRound={currRound}
                  handleRoundChange={handleRoundChange}
                  className="mt-2"
                />
              </div>

              <ScoreCircle
                score={teamBTotalScore}
                teamType={ETeamType.TEAM_B}
                className="w-36 h-36 border-6 shadow-xl bg-white"
              />
            </div>
          </div>

          <div className="w-3/12">
            <TeamInfo
              team={teamB}
              teamType={ETeamType.TEAM_B}
              layout={ELayout.DESKTOP}
            />
          </div>
        </div>
      </div>

      {/* Nets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currRoundNets.map((net: INetRelatives, index: number) => (
          <NetInRoundView
            key={index}
            srNet={srMap.get(net._id) || null}
            net={net}
            setView={setView}
            teamA={teamA}
            teamB={teamB}
            currRoundNets={currRoundNets}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            matchId={matchId}
            view={view}
          />
        ))}
      </div>
    </div>
  );
};

export default RoundView;
