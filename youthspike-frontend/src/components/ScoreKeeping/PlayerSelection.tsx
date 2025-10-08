import TextImg from '@/components/elements/TextImg';
import { useAppDispatch } from '@/redux/hooks';
import { setMessage } from '@/redux/slices/elementSlice';
import { EMessage, INetPlayers, IPlayer, IServerReceiverOnNetMixed, ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import React from 'react';

interface PlayerSelectionProps {
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  teamA: ITeam | null | undefined;
  teamB: ITeam | null | undefined;
  playersOfSelectedNet: null | INetPlayers;
  serverPlaceholder: boolean;
  receiverPlaceholder: boolean;
  handleServerSelection: (e: React.SyntheticEvent, playerId: string | null) => void;
  handleReceiverSelection: (e: React.SyntheticEvent, playerId: string | null) => void;
  handleClosePlayers: (e: React.SyntheticEvent) => void;
  currServerReceiver: IServerReceiverOnNetMixed | null;
}

const PlayerSelection: React.FC<PlayerSelectionProps> = ({
  teamAPlayers,
  teamBPlayers,
  teamA,
  teamB,
  playersOfSelectedNet,
  serverPlaceholder,
  receiverPlaceholder,
  handleServerSelection,
  handleReceiverSelection,
  handleClosePlayers,
  currServerReceiver,
}) => {
  const dispatch = useAppDispatch();
  const getPlayersMap = (players: IPlayer[]) => new Map<string, IPlayer>(players.map((p) => [p._id, p]));

  const getTeamPlayers = (teamKeyPrefix: string, playersMap: Map<string, IPlayer>) => {
    return ['PlayerA', 'PlayerB'].map((suffix) => {
      const key = `${teamKeyPrefix}${suffix}` as keyof INetPlayers;
      const playerId = playersOfSelectedNet ? playersOfSelectedNet[key] : undefined;
      return playersMap.get(playerId || '') || null;
    });
  };

  const renderTeam = (label: string, players: IPlayer[], playerIdsKeyPrefix: string) => {
    const playersMap = getPlayersMap(players);
    const [playerA, playerB] = getTeamPlayers(playerIdsKeyPrefix, playersMap);

    // Check player A or player B is selected or not
    let teamSelected = false;
    if (currServerReceiver?.server === playerA?._id || currServerReceiver?.server === playerB?._id) {
      teamSelected = true;
    }

    if (currServerReceiver?.receiver === playerA?._id || currServerReceiver?.receiver === playerB?._id) {
      teamSelected = true;
    }

    if (teamSelected) {
      return null;
    }

    return (
      <div className="w-full md:w-1/2">
        <h4 className="text-lg font-bold mb-4 text-center">{label}</h4>
        <div className="space-y-4">
          {[playerA, playerB].map((player, index) => {
            if (!player) return null;

            const handleClick = (e: React.SyntheticEvent) =>
              teamSelected
                ? dispatch(setMessage({ message: 'This team is already selected!', type: EMessage.ERROR }))
                : serverPlaceholder
                  ? handleServerSelection(e, player._id)
                  : handleReceiverSelection(e, player._id);

            return (
              <div
                key={player._id || index}
                role="presentation"
                onClick={handleClick}
                className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-700 transition duration-200 cursor-pointer"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  {player.profile ? (
                    <CldImage alt={player.firstName} width="200" height="200" className="w-full h-full object-cover object-center" src={player.profile} crop="scale" />
                  ) : (
                    <TextImg className="w-full h-full" fullText={`${player.firstName} ${player.lastName}`} />
                  )}
                </div>
                <div className="text-lg font-medium">
                  {player.firstName} {player.lastName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 rounded-xl shadow-lg relative">
      {/* Close Button */}
      <button
        onClick={handleClosePlayers}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-red-600 transition"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-bold text-center text-yellow-500 mb-10 uppercase tracking-wide">Select a {serverPlaceholder ? 'Server' : receiverPlaceholder ? 'Receiver' : ''}</h3>

      {playersOfSelectedNet && (
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {renderTeam(teamA?.name || 'Team A', teamAPlayers, 'teamA')}
          {renderTeam(teamB?.name || 'Team B', teamBPlayers, 'teamB')}
        </div>
      )}
    </div>
  );
};

export default PlayerSelection;
