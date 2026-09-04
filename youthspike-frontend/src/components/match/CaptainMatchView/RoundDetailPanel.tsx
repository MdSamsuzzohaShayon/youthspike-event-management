import { ETeam, IMatch, IMatchRelatives, IRoundRelatives } from "@/types";
import { useCallback } from "react";
import LogoMatchScore from "./LogoMatchScore";
import PointsByRound from "./PointsByRound";

interface IRoundDetailPanelProps {
  myTeam: any;
  opTeam: any;
  myTeamE: ETeam;
  opTeamE: ETeam;
  match: IMatchRelatives;
  roundList: IRoundRelatives[];
  roundButtons: React.ReactNode;
}


const RoundDetailPanel: React.FC<IRoundDetailPanelProps> = ({
  myTeam,
  opTeam,
  myTeamE,
  opTeamE,
  match,
  roundList,
  roundButtons,
}) => {
  const hasPenaltyShootout = Boolean(match.teamAP) || Boolean(match.teamBP);

  const getTeamPenalty = useCallback((teamE: ETeam): number => {
    return teamE === ETeam.teamA ? match.teamAP || 0 : match.teamBP || 0;
  }, [match.teamAP, match.teamBP]);

  return (
    <div
      className="w-full h-full relative border border-gray-300 flex flex-col justify-between"
    >
      <div className="w-full bg-gradient-dark px-2 flex flex-col items-center justify-between h-3/6">
        <LogoMatchScore
          dark
          team={opTeam}
          teamE={opTeamE}
          completed={match.completed}
          penalty={getTeamPenalty(opTeamE)}
        />

        <div className="w-full">
          {hasPenaltyShootout && (
            <button
              className={`single-r bg-white py-1 text-center cursor-pointer text-sm w-8 md:text-xs md:w-6 rounded-t-lg`}
              type="button"
              disabled
              aria-label="Penalty shootout"
            >
              PT
            </button>
          )}
          {roundButtons}
        </div>

        <PointsByRound
          roundList={roundList}
          dark
          currMatch={match}
        />
      </div>

      {match.completed && (
        <div
          className="absolute w-full top-1/2 z-10 bg-white border border-black-logo text-center"
          style={{ transform: "translate(0%, -50%)" }}
        >
          Final Score
        </div>
      )}

      <div className="round-bottom w-full border border-gray-300 px-2 flex flex-col items-center justify-between  h-3/6">
        <PointsByRound
          roundList={roundList}
          dark={false}
          currMatch={match}
        />

        <div className="w-full">
          <LogoMatchScore
            dark={false}
            team={myTeam}
            teamE={myTeamE}
            completed={match.completed}
            penalty={getTeamPenalty(myTeamE)}
          />
        </div>
      </div>
    </div>
  );
};

export default RoundDetailPanel;