import React, { useMemo } from 'react';
import { EServerReceiverAction, ETeam, IPlayer, IServerReceiverOnNetMixed, ITeam } from '@/types';
import { toOrdinal } from '@/utils/helper';

interface IScoreBoardProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverReceiverAction: EServerReceiverAction | null;
}

function ScoreBoard({ currServerReceiver, teamA, teamB, teamAPlayers, teamBPlayers, selectedServer, selectedReceiver, serverReceiverAction }: IScoreBoardProps) {
  // Memoize player ID sets
  const teamAPlayerIds = useMemo(() => new Set(teamAPlayers.map((p) => p._id)), [teamAPlayers]);
  const teamBPlayerIds = useMemo(() => new Set(teamBPlayers.map((p) => p._id)), [teamBPlayers]);

  // Precompute logic once
  const getPointIndicator = (team: ETeam): JSX.Element | null => {
    if (!selectedServer || !selectedReceiver || !serverReceiverAction) return null;

    const isServerInTeam = team === ETeam.teamA ? teamAPlayerIds.has(selectedServer) : teamBPlayerIds.has(selectedServer);
    const isReceiverInTeam = team === ETeam.teamA ? teamAPlayerIds.has(selectedReceiver) : teamBPlayerIds.has(selectedReceiver);

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

    if ((serverTeamGetsPoint && isServerInTeam) || (receiverTeamGetsPoint && isReceiverInTeam)) {
      return <p className="absolute bottom-1.5 right-2 text-green-500 text-xs font-bold animate-bounce">+1</p>;
    }

    return null;
  };

  // relative flex flex-col items-center w-28 lg:w-36 p-4 rounded-3xl transition-all border shadow-lg hover:shadow-2xl backdrop-blur-sm bg-gray-900/90 border-gray-700

  return (
    <div className="flex flex-col md:flex-col items-center justify-center space-y-6 md:space-y-8">
      <div className="bg-yellow-400 text-black px-6 py-2 rounded-full text-sm font-bold shadow-md uppercase tracking-wide animate-pulse">{`${toOrdinal(currServerReceiver?.mutate || 0)} play`}</div>
      <div className="w-full grid grid-cols-2 gap-4">

        {/* Team A */}
        <div className="flex flex-col items-center justify-center space-y-3 p-2 lg:p-4 rounded-3xl transition-all border shadow-lg hover:shadow-2xl backdrop-blur-sm bg-gray-900/90 border-gray-700">
          <h2 className="uppercase text-sm font-medium text-yellow-300 tracking-wide text-center">{teamA?.name}</h2>
          <div className="relative bg-white text-black h-20 lg:h-28 w-20 lg:w-28 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-400">
            <h2 className="text-4xl font-bold">{currServerReceiver?.teamAScore || 0}</h2>
            {getPointIndicator(ETeam.teamA)}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center justify-center space-y-3 p-2 lg:p-4 rounded-3xl transition-all border shadow-lg hover:shadow-2xl backdrop-blur-sm bg-gray-900/90 border-gray-700">
          <h2 className="uppercase text-sm font-medium text-yellow-300 tracking-wide text-center">{teamB?.name}</h2>
          <div className="relative bg-white text-black h-20 lg:h-28 w-20 lg:w-28 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-400">
            <h2 className="text-4xl font-bold">{currServerReceiver?.teamBScore || 0}</h2>
            {getPointIndicator(ETeam.teamB)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoreBoard;
