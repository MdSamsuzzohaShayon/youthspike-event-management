import React, { useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { ETeam, IRoundRelatives, IMatchRelatives } from "@/types";
import { screen } from "@/utils/constant";
import { calcRoundScore } from "@/utils/scoreCalc";

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
  const { myTeamE, opTeamE } = useAppSelector((s) => s.matches);
  const allNets = useAppSelector((s) => s.nets.nets);

  // --------- Layout Helpers ----------
  const boxSizeClass = screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8";
  const baseFlexDir = dark ? "flex-col" : "flex-col-reverse";
  const textColor = dark ? "text-white" : "text-black-logo";

  // --------- Determine Plus/Minus and Score for a Round ----------
  const renderRoundScore = useCallback(
    (round: IRoundRelatives) => {
      const activeTeam = dark ? opTeamE : myTeamE;

      const netsForRound = allNets.filter((n) => n.round === round._id);
      const { score, plusMinusScore } = calcRoundScore(
        netsForRound,
        round,
        activeTeam
      );

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
            {score}
          </p>
        </>
      );
    },
    [allNets, myTeamE, opTeamE, dark]
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
    if (
      currMatch.teamAP == null ||
      currMatch.teamAP === 0 ||
      currMatch.teamBP == null ||
      currMatch.teamBP === 0
    )
      return null;

    const isTeamA = myTeamE === ETeam.teamA;
    const isTeamB = myTeamE === ETeam.teamB;

    return dark
      ? // dark mode = show opposing team
        isTeamA
        ? currMatch.teamBP
        : currMatch.teamAP
      : // light mode = show my team
      isTeamB
      ? currMatch.teamBP
      : currMatch.teamAP;
  }, [currMatch, myTeamE, dark]);

  return (
    <div
      className={`points-by-round flex flex-wrap justify-center items-center w-full ${textColor} gap-1`}
    >
      {/* Base match-wide score box */}
      {matchBasePoint !== null && (
        <div
          className={`r-box ${boxSizeClass} flex flex-wrap ${baseFlexDir} justify-center items-center`}
        >
          <p className="plus-minus w-full h-6" />
          <p
            className={`base-point h-10 w-full border border-yellow ${
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
