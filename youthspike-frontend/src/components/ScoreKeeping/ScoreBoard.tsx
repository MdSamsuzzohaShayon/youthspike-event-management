import React from "react";
import {
  ETeam,
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
}: IScoreBoardProps) {
  const handleTeamSelect = (e: React.SyntheticEvent, teamE: ETeam) => {
    e.preventDefault();
    setAwardTo(teamE);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center gap-6">
      {/* Pulsing Status */}
      <div
        onClick={handleOpenPlays}
        className="bg-yellow-logo text-black text-xs md:text-sm font-bold uppercase tracking-wider px-4 py-1 md:px-6 md:py-2 rounded-full shadow-md w-fit mx-auto animate-pulse ring-2 ring-yellow-500 ring-offset-1 md:ring-offset-2"
      >
        {`${toOrdinal(currServerReceiver?.mutate || 1)} play`}
      </div>

      {/* Responsive Team Layout */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-6">
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
            className={`flex items-center md:flex-col justify-between md:justify-center px-3 py-2 md:p-6 rounded-xl md:rounded-3xl border border-gray-700 ${
              teamE === awardTo ? "bg-yellow-logo" : "bg-gray-900/90"
            } shadow-sm md:shadow-lg transition-all duration-300`}
            role="presentation"
            onClick={(e) => handleTeamSelect(e, teamE)}
          >
            {/* Logo */}
            {team?.logo ? (
              <CldImage
                width={48}
                height={48}
                alt={team.name}
                src={team.logo}
                className="h-12 w-12 lg:24 rounded-full ring-2 ring-yellow-400"
              />
            ) : (
              <TextImg
                className="h-12 w-12 lg:24 rounded-full ring-2 ring-yellow-400"
                fullText={team?.name}
              />
            )}

            {/* Text & Score Group */}
            <div className="flex-1 flex flex-col items-end md:items-center justify-between ml-3 md:ml-0 md:mt-4 space-y-1">
              <h4
                className={`uppercase ${
                  teamE === awardTo ? "text-black" : "text-yellow-300"
                } tracking-wide text-right md:text-center`}
              >
                {team?.name}
              </h4>

              <div className="relative bg-white text-black h-12 w-12 lg:24 rounded-full flex items-center justify-center shadow-md border-2 md:border-4 border-yellow-400 text-lg md:text-4xl font-bold">
                {score}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currPlays.length > 0 && (
        <button
          className="btn-info"
          onClick={(e) => {
            revertPlayEl.current?.showModal();
          }}
        >
          Revert Play
        </button>
      )}
    </div>
  );
}

export default ScoreBoard;
