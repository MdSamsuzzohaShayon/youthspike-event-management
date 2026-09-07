import React, { useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { ETeam, IRoundRelatives, IMatchRelatives } from "@/types";

// Assuming a type structure for the round score object based on usage
interface IRoundScoreData {
  teamARPlusMinus: number;
  teamBRPlusMinus: number;
  teamARScore: number;
  teamBRScore: number;
}

interface IPointsByRoundProps {
  isDarkMode: boolean;
  roundList: IRoundRelatives[];
  currMatch: IMatchRelatives;
}

interface IScoreBoxProps {
  plusMinusScore: number | null;
  baseScore: number | null;
  isDarkMode: boolean;
}

/**
 * Pure helper: Calculate the match base point based on the viewing team and mode.
 */
const calculateMatchBasePoint = (
  currMatch: IMatchRelatives,
  myTeamE: ETeam | null,
  isDarkMode: boolean
): number | null => {
  const { teamAP, teamBP } = currMatch;
  
  // If both are missing, there is no base point
  if (teamAP == null && teamBP == null) return null;

  const isMyTeamA = myTeamE === ETeam.teamA;
  const isMyTeamB = myTeamE === ETeam.teamB;

  if (isDarkMode) {
    // Dark mode = show opposing team's base point
    return isMyTeamA ? (teamBP ?? 0) : (teamAP ?? 0);
  } else {
    // Light mode = show my team's base point
    return isMyTeamB ? (teamBP ?? 0) : (teamAP ?? 0);
  }
};

/**
 * Pure helper: Get plus/minus score for the active team.
 */
const getPlusMinusScore = (
  roundScore: IRoundScoreData,
  activeTeam: ETeam | null
): number | null => {
  if (!activeTeam) return null;
  return activeTeam === ETeam.teamA 
    ? roundScore.teamARPlusMinus 
    : roundScore.teamBRPlusMinus;
};

/**
 * Pure helper: Get base score for the active team.
 */
const getBaseScore = (
  roundScore: IRoundScoreData,
  activeTeam: ETeam | null
): number | null => {
  if (!activeTeam) return null;
  return activeTeam === ETeam.teamA 
    ? roundScore.teamARScore 
    : roundScore.teamBRScore;
};

/**
 * Subcomponent: Renders a single score box (Plus/Minus & Base Point)
 * Extracted to follow SRP and DRY principles.
 */
const ScoreBox = React.memo(({ plusMinusScore, baseScore, isDarkMode }: IScoreBoxProps) => {
  const baseFlexDir = isDarkMode ? "flex-col" : "flex-col-reverse";
  const borderClass = isDarkMode ? "rounded-t-lg" : "rounded-b-lg";
  
  const plusMinusClass = plusMinusScore !== null 
    ? (plusMinusScore >= 0 ? "text-green-600" : "text-red-600") 
    : "";

  const formattedPlusMinus = plusMinusScore !== null
    ? (plusMinusScore > 0 ? `+${plusMinusScore}` : `${plusMinusScore}`)
    : "";

  return (
    <div
      className={`r-box text-xs w-6 md:text-xs md:w-6 flex flex-wrap ${baseFlexDir} justify-center items-center`}
    >
      <p className={`plus-minus w-full text-center h-6 ${plusMinusClass}`}>
        {formattedPlusMinus}
      </p>
      <p
        className={`base-point h-10 w-full border border-yellow-logo ${borderClass} flex justify-center items-center`}
      >
        {baseScore ?? ""}
      </p>
    </div>
  );
});

ScoreBox.displayName = "ScoreBox";

export default function PointsByRound({
  isDarkMode,
  roundList,
  currMatch,
}: IPointsByRoundProps) {
  const { myTeamE, opTeamE, roundMap } = useAppSelector((s) => s.matches);
  
  // Determine which team's data to display based on theme
  const currentViewingTeam = isDarkMode ? opTeamE : myTeamE;
  const textColor = isDarkMode ? "text-white" : "text-black-logo";

  const matchBasePoint = useMemo(
    () => calculateMatchBasePoint(currMatch, myTeamE, isDarkMode),
    [currMatch, myTeamE, isDarkMode]
  );

  const renderRoundBox = useCallback(
    (round: IRoundRelatives) => {
      // Safely access the round score from the map
      const roundScore = roundMap[round._id] as IRoundScoreData | undefined;
      
      if (!roundScore) {
        return (
          <ScoreBox 
            key={round._id} 
            plusMinusScore={null} 
            baseScore={null} 
            isDarkMode={isDarkMode} 
          />
        );
      }

      const plusMinusScore = getPlusMinusScore(roundScore, currentViewingTeam);
      const baseScore = getBaseScore(roundScore, currentViewingTeam);

      return (
        <ScoreBox 
          key={round._id} 
          plusMinusScore={plusMinusScore} 
          baseScore={baseScore} 
          isDarkMode={isDarkMode} 
        />
      );
    },
    [roundMap, currentViewingTeam, isDarkMode]
  );

  return (
    <div
      className={`points-by-round flex flex-wrap justify-center items-center w-full ${textColor} gap-1`}
    >
      {/* Base match-wide score box */}
      {matchBasePoint !== null && (
        <ScoreBox 
          plusMinusScore={null} 
          baseScore={matchBasePoint} 
          isDarkMode={isDarkMode} 
        />
      )}

      {/* Round-by-round point boxes */}
      {roundList.map(renderRoundBox)}
    </div>
  );
}