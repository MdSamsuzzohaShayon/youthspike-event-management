import React, { useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { ETeam, IRoundRelatives, IMatchRelatives } from "@/types";
import { screen } from "@/utils/constant";

interface IPointsByRoundProps {
  dark: boolean;
  roundList: IRoundRelatives[];
  screenWidth: number;
  currMatch: IMatchRelatives;
}

export default function PointsByRound({
  dark,
  roundList,
  screenWidth,
  currMatch,
}: IPointsByRoundProps) {
  const { myTeamE, opTeamE, roundMap } = useAppSelector((s) => s.matches);
  const allNets = useAppSelector((s) => s.nets.nets);

  // --------- Layout Helpers ----------
  const boxSizeClass = screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8";
  const baseFlexDir = dark ? "flex-col" : "flex-col-reverse";
  const textColor = dark ? "text-white" : "text-black-logo";
  const activeTeam = dark ? opTeamE : myTeamE;

  // --------- Determine Plus/Minus and Score for a Round ----------
  const renderRoundScore = useCallback(
    (round: IRoundRelatives) => {
      // Get round score from an object
      const roundScore = roundMap[round._id];
      if (!roundScore) return null;

      const plusMinusScore =
        activeTeam === ETeam.teamA
          ? roundScore.teamARPlusMinus
          : roundScore.teamBRPlusMinus;

      const plusMinusClass =
        plusMinusScore >= 0 ? "text-green-600" : "text-red-600";

      return (
        <>
          <p className={`plus-minus w-full text-center h-6 ${plusMinusClass}`}>
            {plusMinusScore > 0 ? `+${plusMinusScore}` : plusMinusScore}
          </p>

          <p
            className={`base-point h-10 w-full border border-yellow ${
              dark ? "rounded-t-lg" : "rounded-b-lg"
            } flex justify-center items-center`}
          >
            {activeTeam === ETeam.teamA
              ? roundScore.teamARScore
              : roundScore.teamBRScore}
          </p>
        </>
      );
    },
    [allNets, myTeamE, opTeamE, dark, roundMap]
  );

  // --------- Render Single Round Box ----------
  const renderRoundBox = useCallback(
    (round: IRoundRelatives) => (
      <div
        key={round._id}
        className={`r-box ${boxSizeClass} flex flex-wrap ${baseFlexDir} justify-center items-center`}
      >
        {renderRoundScore(round)}
      </div>
    ),
    [renderRoundScore, boxSizeClass, baseFlexDir]
  );

  // --------- Determine Match Base Point (teamAP/BP) ----------
  const matchBasePoint = useMemo(() => {
    if (!currMatch.teamAP && !currMatch.teamBP) return null;

    const isTeamA = myTeamE === ETeam.teamA;
    const isTeamB = myTeamE === ETeam.teamB;

    return dark
      ? // dark mode = show opposing team
        (isTeamA ? currMatch.teamBP : currMatch.teamAP) || 0
      : // light mode = show my team
        (isTeamB ? currMatch.teamBP : currMatch.teamAP) || 0;
  }, [currMatch, myTeamE, dark]);

  return (
    <div
      className={`points-by-round flex flex-wrap justify-center items-center w-full ${textColor} gap-1`}
    >
      {/* Base match-wide score box */}
      {(matchBasePoint || matchBasePoint === 0) && (
        <div
          className={`r-box ${boxSizeClass} flex flex-wrap ${baseFlexDir} justify-center items-center`}
        >
          <p className="plus-minus w-full h-6" />
          <p
            className={`base-point h-10 w-full border border-yellow-logo ${
              dark ? "rounded-t-lg" : "rounded-b-lg"
            } flex justify-center items-center`}
          >
            {matchBasePoint}
          </p>
        </div>
      )}

      {/* Round-by-round point boxes */}
      {roundList.map(renderRoundBox)}
    </div>
  );
}
