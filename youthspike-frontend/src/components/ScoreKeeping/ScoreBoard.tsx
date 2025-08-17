import React, { useMemo } from "react";
import {
  EServerReceiverAction,
  ETeam,
  IPlayer,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import { toOrdinal } from "@/utils/helper";
import { CldImage } from "next-cloudinary";
import TextImg from "@/components/elements/TextImg";

interface IScoreBoardProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverReceiverAction: EServerReceiverAction | null;
  handleOpenPlays: (e: React.SyntheticEvent) => void;
  awardTo: ETeam | null;
  setAwardTo: React.Dispatch<React.SetStateAction<ETeam | null>>;
}

function ScoreBoard({
  currServerReceiver,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  selectedServer,
  selectedReceiver,
  serverReceiverAction,
  handleOpenPlays,
  awardTo,
  setAwardTo,
}: IScoreBoardProps) {
  // Memoize player ID sets
  const teamAPlayerIds = useMemo(
    () => new Set(teamAPlayers.map((p) => p._id)),
    [teamAPlayers]
  );
  const teamBPlayerIds = useMemo(
    () => new Set(teamBPlayers.map((p) => p._id)),
    [teamBPlayers]
  );

  // Precompute logic once
  const getPointIndicator = (team: ETeam): React.ReactNode | null => {
    if (!selectedServer || !selectedReceiver || !serverReceiverAction)
      return null;

    const isServerInTeam =
      team === ETeam.teamA
        ? teamAPlayerIds.has(selectedServer)
        : teamBPlayerIds.has(selectedServer);
    const isReceiverInTeam =
      team === ETeam.teamA
        ? teamAPlayerIds.has(selectedReceiver)
        : teamBPlayerIds.has(selectedReceiver);

    const serverTeamGetsPoint = new Set([
      EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
      EServerReceiverAction.SERVER_ACE_NO_TOUCH,
      EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
      EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
      EServerReceiverAction.SERVER_DO_NOT_KNOW,
    ]).has(serverReceiverAction);

    const receiverTeamGetsPoint = new Set([
      EServerReceiverAction.RECEIVER_SERVICE_FAULT,
      EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
      EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
      EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
    ]).has(serverReceiverAction);

    if (
      (serverTeamGetsPoint && isServerInTeam) ||
      (receiverTeamGetsPoint && isReceiverInTeam)
    ) {
      return (
        <p className="absolute bottom-1 right-2 text-green-500 text-3xl font-bold animate-bounce">
          +1
        </p>
      );
    }

    return null;
  };

  const handleTeamSelect = (e: React.SyntheticEvent, teamE: ETeam) => {
    e.preventDefault();
    setAwardTo(teamE);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
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
              <h4 className={`uppercase ${teamE === awardTo ? "text-black" : "text-yellow-300"} tracking-wide text-right md:text-center`}>
                {team?.name}
              </h4>

              <div className="relative bg-white text-black h-12 w-12 lg:24 rounded-full flex items-center justify-center shadow-md border-2 md:border-4 border-yellow-400 text-lg md:text-4xl font-bold">
                {score}
                {getPointIndicator(teamE)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreBoard;
