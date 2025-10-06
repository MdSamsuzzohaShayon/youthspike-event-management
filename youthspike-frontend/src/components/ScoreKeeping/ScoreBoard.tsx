import React, { useCallback, useMemo } from "react";
import {
  ETeam,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { toOrdinal } from "@/utils/helper";
import { CldImage } from "next-cloudinary";
import TextImg from "@/components/elements/TextImg";

interface IScoreBoardProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  handleOpenPlays: (e: React.SyntheticEvent) => void;
  awardTo: ETeam | null;
  setAwardTo: React.Dispatch<React.SetStateAction<ETeam | null>>;
  currPlays: IServerReceiverSinglePlay[];
  revertPlayEl: React.RefObject<HTMLDialogElement | null>;
  stickyScoreBoardRef: React.RefObject<HTMLDivElement | null>;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}

function ScoreBoard({
  currServerReceiver,
  teamA,
  teamB,
  handleOpenPlays,
  awardTo,
  setAwardTo,
  currPlays,
  revertPlayEl,
  stickyScoreBoardRef,
  teamAPlayers,
  teamBPlayers,
}: IScoreBoardProps) {
  // Auto-scroll to top for mobile when team is selected
  const handleTeamSelect = (e: React.SyntheticEvent, teamE: ETeam) => {
    e.preventDefault();
    setAwardTo(teamE);

    if (stickyScoreBoardRef.current && window.innerWidth < 768) {
      setTimeout(() => {
        stickyScoreBoardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // Precompute a lookup for faster access
  const playerMap = useMemo(() => {
    const map: Record<string, IPlayer> = {};
    teamAPlayers.forEach((p) => (map[p._id] = p));
    teamBPlayers.forEach((p) => (map[p._id] = p));
    return map;
  }, [teamAPlayers, teamBPlayers]);

  const serverOrReceiver = useCallback(
    (teamE: ETeam) => {
      if (!currServerReceiver?.server || !currServerReceiver?.receiver) return null;

      const isTeamAServing = teamAPlayers.some((p) => p._id === currServerReceiver.server);
      const isTeamBServing = teamBPlayers.some((p) => p._id === currServerReceiver.server);

      let teamRole: "Serving" | "Receiving" | null = null;
      let playerId: string | null = null;

      if ((teamE === ETeam.teamA && isTeamAServing) || (teamE === ETeam.teamB && isTeamBServing)) {
        teamRole = "Serving";
        playerId = String(currServerReceiver.server);
      } else if ((teamE === ETeam.teamA && isTeamBServing) || (teamE === ETeam.teamB && isTeamAServing)) {
        teamRole = "Receiving";
        playerId = String(currServerReceiver.receiver);
      }

      if (!teamRole || !playerId) return null;

      const player = playerMap[playerId];
      if (!player) return null;

      return (
        <div className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-gray-800/80 h-full shadow-md">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {player.profile ? (
              <CldImage
                src={player.profile}
                alt={`${player.firstName} ${player.lastName}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <TextImg className="w-full rounded-lg" fullText={`${player.firstName}${player.lastName}`} />
            )}
          </div>
          <div className="flex flex-col text-sm md:text-base">
            <span className="uppercase font-semibold text-yellow-logo">{teamRole}</span>
            <span className="text-white font-medium word-breaks">{player.firstName} {player.lastName}</span>
          </div>
        </div>
      );
    },
    [currServerReceiver, playerMap, teamAPlayers, teamBPlayers]
  );

  return (
    <div className="w-full flex flex-col justify-center items-center gap-4 md:gap-6">
      {/* Mobile Scoreboard */}
      <div className="w-full flex md:hidden gap-x-2 justify-between items-center">
        <div className="w-5/12">{serverOrReceiver(ETeam.teamA)}</div>
        <button
          onClick={handleOpenPlays}
          className="w-2/12 bg-yellow-logo text-black text-xs md:text-sm font-bold uppercase tracking-wider px-4 py-1 md:px-6 md:py-2 rounded-full shadow-md animate-pulse ring-2 ring-yellow-500 ring-offset-1"
        >
          {`${toOrdinal(currServerReceiver?.mutate || 1)} play`}
        </button>
        <div className="w-5/12">{serverOrReceiver(ETeam.teamB)}</div>
      </div>

      {/* Teams & Scores */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-3/4">
        {[
          { team: teamA, score: currServerReceiver?.teamAScore || 0, teamE: ETeam.teamA },
          { team: teamB, score: currServerReceiver?.teamBScore || 0, teamE: ETeam.teamB },
        ].map(({ team, score, teamE }) => (
          <div
            key={team?.name}
            className={`flex-1 flex flex-col items-center justify-between p-4 md:p-6 rounded-xl md:rounded-3xl border border-gray-700 shadow-sm md:shadow-lg transition-all duration-300 cursor-pointer ${
              teamE === awardTo ? "bg-yellow-logo text-black" : "bg-gray-900/90 text-yellow-logo"
            }`}
            onClick={(e) => handleTeamSelect(e, teamE)}
          >
            <h4 className="uppercase font-semibold text-center">{team?.name}</h4>
            <div className="flex justify-between items-center w-full mt-2 md:mt-4 gap-2">
              {team?.logo ? (
                <CldImage
                  width={48}
                  height={48}
                  alt={team.name}
                  src={team.logo}
                  className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-lg"
                />
              ) : (
                <TextImg className="h-12 w-12 md:h-16 md:w-16" fullText={team?.name} />
              )}
              <div className="relative bg-white text-black h-12 w-12 md:h-16 md:w-16 rounded-full flex items-center justify-center shadow-md border-2 md:border-4 border-yellow-400 text-lg md:text-3xl font-bold">
                {score}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currPlays.length > 0 && (
        <button
          className="btn-info mt-2 md:mt-4"
          onClick={() => revertPlayEl.current?.showModal()}
        >
          Revert Play
        </button>
      )}
    </div>
  );
}

export default ScoreBoard;
