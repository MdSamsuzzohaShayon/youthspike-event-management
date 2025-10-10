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
import Image from "next/image";

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
      if (!currServerReceiver?.server || !currServerReceiver?.receiver)
        return null;

      const isTeamAServing = teamAPlayers.some(
        (p) => p._id === currServerReceiver.server
      );
      const isTeamBServing = teamBPlayers.some(
        (p) => p._id === currServerReceiver.server
      );

      let teamRole: "Serving" | "Receiving" | null = null;
      let playerId: string | null = null;

      if (
        (teamE === ETeam.teamA && isTeamAServing) ||
        (teamE === ETeam.teamB && isTeamBServing)
      ) {
        teamRole = "Serving";
        playerId = String(currServerReceiver.server);
      } else if (
        (teamE === ETeam.teamA && isTeamBServing) ||
        (teamE === ETeam.teamB && isTeamAServing)
      ) {
        teamRole = "Receiving";
        playerId = String(currServerReceiver.receiver);
      }

      if (!teamRole || !playerId) return null;

      const player = playerMap[playerId];
      if (!player) return null;

      return (
        <div className="flex flex-col gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-gray-800/80 h-full shadow-md">
          <div className="text-yellow-logo uppercase text-left flex gap-x-1 items-center">
            <span>
              {player.profile ? (
                <CldImage
                  src={player.profile}
                  alt={`${player.firstName} ${player.lastName}`}
                  width={64}
                  height={64}
                  className="object-cover object-center w-6 h-6 rounded-sm"
                  crop="fit"
                />
              ) : (
                <TextImg
                  className="w-6 h-6 rounded-sm"
                  fullText={`${player.firstName}${player.lastName}`}
                />
              )}
            </span>
            {teamRole}
          </div>
          <h5 className="text-white font-medium word-breaks">
            {player.firstName} {player.lastName}
          </h5>
        </div>
      );
    },
    [currServerReceiver, playerMap, teamAPlayers, teamBPlayers]
  );

  return (
    <div className="w-full flex flex-col justify-center items-center">
      {/* Mobile Scoreboard */}
      <div className="w-full flex md:hidden gap-x-2 justify-between items-center">
        <div className="w-6/12">{serverOrReceiver(ETeam.teamA)}</div>
        <div className="w-6/12">{serverOrReceiver(ETeam.teamB)}</div>
      </div>

      {/* Teams & Scores */}
      <div className="flex flex-row gap-2 md:gap-4 w-full mt-2 md:mt-0">
        {[
          {
            team: teamA,
            score: currServerReceiver?.teamAScore || 0,
            teamE: ETeam.teamA,
          },
          {
            team: teamB,
            score: currServerReceiver?.teamBScore || 0,
            teamE: ETeam.teamB,
          },
        ].map(({ team, score, teamE }) => (
          <div
            key={team?.name}
            className={`relative overflow-hidden w-5/12 flex-1 flex flex-col items-center justify-between p-4 md:p-6 rounded-xl md:rounded-3xl border border-gray-700 shadow-sm md:shadow-lg transition-all duration-300 cursor-pointer ${
              teamE === awardTo
                ? "bg-yellow-logo text-black"
                : teamE === ETeam.teamA
                ? "bg-green-400 text-black"
                : "bg-blue-400 text-black"
            }`}
            onClick={(e) => handleTeamSelect(e, teamE)}
          >
            <h4 className="uppercase font-semibold text-center">
              {team?.name}
            </h4>
            <div
              className={`flex justify-between ${
                teamE === ETeam.teamB ? "flex-row-reverse" : ""
              } items-center w-full mt-2 md:mt-4 gap-2`}
            >
              {team?.logo ? (
                <CldImage
                  width={48}
                  height={48}
                  alt={team.name}
                  src={team.logo}
                  className="h-16 w-16 md:h-12 md:w-12 object-cover object-center rounded-lg"
                  crop="fit"
                />
              ) : (
                <TextImg
                  className="h-16 w-16 md:h-12 md:w-12 rounded-lg"
                  fullText={team?.name}
                />
              )}
              <div className="relative bg-white text-black h-16 w-16 md:h-12 md:w-12 rounded-lg flex items-center justify-center shadow-md border-2 md:border-4 border-yellow-400 text-5xl font-bold">
                {score}
              </div>
            </div>

            {((teamE === ETeam.teamA &&
              teamAPlayers.some((p) => p._id === currServerReceiver?.server)) ||
              (teamE === ETeam.teamB &&
                teamBPlayers.some(
                  (p) => p._id === currServerReceiver?.server
                ))) && (
              <Image
                src="/imgs/spikeball-logo.webp"
                height={100}
                width={100}
                className="absolute right-0 top-0 w-12 h-12 z-10 animate-bounce drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                alt="serving-ball-logo"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 md:mt-4 w-full flex md:hidden justify-center items-center gap-x-2">
        {currPlays.length > 0 && (
          <button
            className="btn-info"
            onClick={() => revertPlayEl.current?.showModal()}
          >
            Revert Play
          </button>
        )}
        <button onClick={handleOpenPlays} className="btn-info">
          {`${toOrdinal(currServerReceiver?.mutate || 1)} play`}
        </button>
      </div>
    </div>
  );
}

export default ScoreBoard;
