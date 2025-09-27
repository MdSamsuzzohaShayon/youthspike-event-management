import React from 'react';
import ServerReceiverDisplay from './ServerReceiverDisplay';
import PlayerSelection from './PlayerSelection';

interface ServerReceiverFlowProps {
  serverTeam: any;
  receiverTeam: any;
  teamA: any;
  teamB: any;
  selectedServer: string | null;
  selectedReceiver: string | null;
  serverPlaceholder: boolean;
  receiverPlaceholder: boolean;
  currServerReceiver: any;
  playersOfcurrNet: any;
  teamAPlayers: any[];
  teamBPlayers: any[];
  onAddServer: () => void;
  onAddReceiver: () => void;
  onServerSelect: (e: React.SyntheticEvent, playerId: string | null) => void;
  onReceiverSelect: (e: React.SyntheticEvent, playerId: string | null) => void;
  onClosePlayers: () => void;
  onSetPlayers: () => void;
  onTogglePreview: () => void;
  onReset: () => void;
}

export default function ServerReceiverFlow({
  serverTeam,
  receiverTeam,
  teamA,
  teamB,
  selectedServer,
  selectedReceiver,
  serverPlaceholder,
  receiverPlaceholder,
  currServerReceiver,
  playersOfcurrNet,
  teamAPlayers,
  teamBPlayers,
  onAddServer,
  onAddReceiver,
  onServerSelect,
  onReceiverSelect,
  onClosePlayers,
  onSetPlayers,
  onTogglePreview,
  onReset,
}: ServerReceiverFlowProps) {
  if (serverPlaceholder || receiverPlaceholder) {
    return (
      <PlayerSelection
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        teamA={teamA}
        teamB={teamB}
        selectedServer={selectedServer}
        selectedReceiver={selectedReceiver}
        playersOfSelectedNet={playersOfcurrNet}
        serverPlaceholder={serverPlaceholder}
        receiverPlaceholder={receiverPlaceholder}
        handleServerSelection={onServerSelect}
        handleReceiverSelection={onReceiverSelect}
        handleClosePlayers={onClosePlayers}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full md:w-3/6">
        <ServerReceiverDisplay
          serverTeam={serverTeam}
          receiverTeam={receiverTeam}
          teamA={teamA}
          teamB={teamB}
          handleAddServer={onAddServer}
          handleAddReceiver={onAddReceiver}
          currServerReceiver={currServerReceiver}
        />

        {selectedServer && selectedReceiver && (
          <div className="my-6 flex gap-x-2 justify-center">
            {!currServerReceiver ? (
              <button
                onClick={onSetPlayers}
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Confirm Order
              </button>
            ) : (
              <button onClick={onReset} className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition">
                Reset
              </button>
            )}

            {currServerReceiver && (
              <button
                onClick={onTogglePreview}
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Action Preview
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}