import {
  ESRRole,
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import PlayerView from "./PlayerView";
import TextImg from "@/components/elements/TextImg";
import React, { useCallback, useMemo } from "react";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import NetInRoundView from "./NetInRoundView";
import LocalStorageService from "@/utils/LocalStorageService";

// Enums for better type safety
enum EDirection {
  PREV = "prev",
  NEXT = "next"
}

enum EArrowSize {
  SM = "sm",
  MD = "md",
  LG = "lg"
}

enum ELayout {
  MOBILE = "mobile",
  DESKTOP = "desktop"
}

enum ETeamType {
  TEAM_A = "teamA",
  TEAM_B = "teamB"
}

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
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();

  const { teamAScore, teamBScore } = useMemo(() => {
    let aScore = 0,
      bScore = 0;
    currRoundNets.forEach((n) => {
      if ((n.teamAScore || 0) > (n.teamBScore || 0)) {
        aScore += n.points;
      } else if ((n.teamAScore || 0) < (n.teamBScore || 0)) {
        bScore += n.points;
      }
    });
    return { teamAScore: aScore, teamBScore: bScore };
  }, [currRoundNets]);
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
    (direction: EDirection) => (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!currRound) return;

      const currIdx = roundIdToIndex[currRound._id];
      let targetIdx: number;

      if (direction === EDirection.PREV && currIdx > 0) {
        targetIdx = currIdx - 1;
      } else if (direction === EDirection.NEXT && currIdx < roundList.length - 1) {
        targetIdx = currIdx + 1;
      } else {
        return;
      }

      changeTheRound(targetIdx);
    },
    [currRound, roundIdToIndex, roundList.length, changeTheRound]
  );

  // Reusable Team Logo Component
  const TeamLogo = ({ team, teamType, className = "" }: { 
    team: ITeam | null; 
    teamType: ETeamType;
    className?: string;
  }) => {
    const borderColor = teamType === ETeamType.TEAM_A 
      ? "border-yellow-400" 
      : "border-white";

    if (team?.logo) {
      return (
        <CldImage
          src={team.logo}
          alt={team.name}
          width={70}
          height={70}
          className={`rounded-full border-4 object-cover ${borderColor} ${className}`}
        />
      );
    }
    return (
      <TextImg
        fullText={team?.name || (teamType === ETeamType.TEAM_A ? "TA" : "TB")}
        className={`rounded-full border-4 font-bold ${borderColor} ${className}`}
      />
    );
  };

  // Reusable Score Circle Component
  const ScoreCircle = ({ score, teamType, className = "" }: { 
    score: number; 
    teamType: ETeamType;
    className?: string;
  }) => {
    const bgColor = teamType === ETeamType.TEAM_A ? "bg-yellow-400" : "bg-white";
    const borderColor = teamType === ETeamType.TEAM_A ? "border-white" : "border-yellow-400";
    const textSize = className.includes("w-40") ? "text-7xl" : "text-5xl md:text-6xl";

    return (
      <div className={`rounded-full flex items-center justify-center shadow-2xl border-4 ${borderColor} ${bgColor} ${className}`}>
        <div className={`text-black font-bold ${textSize}`}>{score}</div>
      </div>
    );
  };

  // Reusable Navigation Arrow Component
  const NavArrow = ({ 
    direction, 
    onClick, 
    size = EArrowSize.MD,
    className = "" 
  }: { 
    direction: EDirection; 
    onClick: (e: React.SyntheticEvent) => void;
    size?: EArrowSize;
    className?: string;
  }) => {
    const sizeClasses = {
      [EArrowSize.SM]: "w-8 h-8",
      [EArrowSize.MD]: "w-12 h-12",
      [EArrowSize.LG]: "w-16 h-16"
    };

    return (
      <Image
        src="/icons/right-arrow.svg"
        alt={`${direction === EDirection.PREV ? "Previous" : "Next"} Round`}
        height={40}
        width={40}
        className={`svg-white cursor-pointer hover:opacity-80 transition-opacity ${
          direction === EDirection.PREV ? "transform rotate-180" : ""
        } ${sizeClasses[size]} ${className}`}
        onClick={onClick}
      />
    );
  };

  // Reusable Round Navigation Section
  const RoundNavigation = ({ size = EArrowSize.MD }: { size?: EArrowSize }) => (
    <div className="flex items-center space-x-4">
      <NavArrow 
        direction={EDirection.PREV} 
        onClick={handleRoundChange(EDirection.PREV)} 
        size={size} 
      />
      <div className="text-yellow-400 font-bold text-xl text-center bg-black px-4 py-2 rounded-full border border-yellow-400">
        Round {currRound?.num}
      </div>
      <NavArrow 
        direction={EDirection.NEXT} 
        onClick={handleRoundChange(EDirection.NEXT)} 
        size={size} 
      />
    </div>
  );

  // Reusable Team Info Section
  const TeamInfo = ({ 
    team, 
    teamType, 
    layout = ELayout.MOBILE 
  }: { 
    team: ITeam | null; 
    teamType: ETeamType;
    layout?: ELayout;
  }) => {
    const isDesktop = layout === ELayout.DESKTOP;
    const logoSize = isDesktop ? "w-20 h-20" : "w-14 h-14";
    const textSize = isDesktop ? "text-lg" : "text-sm";
    const maxWidth = isDesktop ? "max-w-[150px]" : "max-w-[100px]";

    return (
      <div className="flex flex-col items-center space-y-2 flex-1">
        <TeamLogo team={team} teamType={teamType} className={logoSize} />
        <span className={`text-white font-bold ${textSize} truncate ${maxWidth} text-center`}>
          {team?.name}
        </span>
      </div>
    );
  };

  // Reusable VS Badge Component
  const VSBadge = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "w-12 h-12 text-lg",
      md: "w-16 h-16 text-2xl",
      lg: "w-20 h-20 text-3xl"
    };

    return (
      <div className={`bg-yellow-400 text-black font-bold rounded-full flex items-center justify-center mx-auto ${sizeClasses[size]}`}>
        VS
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 md:p-6 rounded-xl">
      {/* Header Section */}
      <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 shadow-lg border border-gray-700">
        
        {/* Mobile Layout: Stacked */}
        <div className="flex flex-col md:hidden items-center space-y-5">
          {/* Round Title and Navigation */}
          <div className="flex items-center justify-center space-x-5 w-full">
            <NavArrow 
              direction={EDirection.PREV} 
              onClick={handleRoundChange(EDirection.PREV)} 
              size={EArrowSize.SM}
            />
            
            <div className="text-yellow-400 font-bold text-xl text-center bg-black px-4 py-2 rounded-full border border-yellow-400">
              Round {currRound?.num}
            </div>

            <NavArrow 
              direction={EDirection.NEXT} 
              onClick={handleRoundChange(EDirection.NEXT)} 
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

              <RoundNavigation size={EArrowSize.MD} />
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
          />
        ))}
      </div>
    </div>
  );
};

export default RoundView;