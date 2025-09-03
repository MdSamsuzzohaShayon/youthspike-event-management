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
  view
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();

  const { teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);

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
      } else if (direction === ENDirection.NEXT && currIdx < roundList.length - 1) {
        targetIdx = currIdx + 1;
      } else {
        return;
      }

      changeTheRound(targetIdx);
    },
    [currRound, roundIdToIndex, roundList.length, changeTheRound]
  );
  

  return (
    <div className="bg-gray-900 min-h-screen p-4 md:p-6 rounded-xl">
      {/* Header Section */}
      <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 shadow-lg border border-gray-700">
        
        {/* Mobile Layout: Stacked */}
        <div className="flex flex-col md:hidden items-center space-y-5">
          {/* Round Title and Navigation */}
          <div className="flex items-center justify-center space-x-5 w-full">
            <NavArrow 
              direction={ENDirection.PREV} 
              onClick={handleRoundChange(ENDirection.PREV)} 
              size={EArrowSize.SM}
            />
            
            <div className="text-yellow-400 font-bold text-xl text-center bg-black px-4 py-2 rounded-full border border-yellow-400">
              Round {currRound?.num}
            </div>

            <NavArrow 
              direction={ENDirection.NEXT} 
              onClick={handleRoundChange(ENDirection.NEXT)} 
              size={EArrowSize.SM}
            />
          </div>

          {/* Teams and Logos */}
          <div className="flex items-center justify-between w-full px-4">
            <TeamInfo team={teamA} teamType={ETeamType.TEAM_A} />
            
            <div className="mx-2">
              <VSBadge size="sm" />
            </div>

            <TeamInfo team={teamB} teamType={ETeamType.TEAM_B} />
          </div>

          {/* Score Display - Mobile */}
          <div className="flex items-center justify-center space-x-6 w-full px-4">
            <ScoreCircle score={teamATotalScore} teamType={ETeamType.TEAM_A} className="w-28 h-28" />
            
            <div className="text-yellow-400 font-bold text-4xl">-</div>
            
            <ScoreCircle score={teamBTotalScore} teamType={ETeamType.TEAM_B} className="w-28 h-28" />
          </div>
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden md:flex items-center justify-between">
          <TeamInfo team={teamA} teamType={ETeamType.TEAM_A} layout={ELayout.DESKTOP} />

          {/* Score Display - Desktop */}
          <div className="flex items-center justify-center space-x-8 mx-6">
            <ScoreCircle score={teamATotalScore} teamType={ETeamType.TEAM_A} className="w-40 h-40 border-6" />
            
            {/* Center: VS and Round Navigation */}
            <div className="flex flex-col items-center space-y-4 mx-2">
              <VSBadge size="md" />

              <RoundNavigation size={EArrowSize.MD} currRound={currRound} handleRoundChange={handleRoundChange} />
            </div>

            <ScoreCircle score={teamBTotalScore} teamType={ETeamType.TEAM_B} className="w-40 h-40 border-6" />
          </div>

          <TeamInfo team={teamB} teamType={ETeamType.TEAM_B} layout={ELayout.DESKTOP} />
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