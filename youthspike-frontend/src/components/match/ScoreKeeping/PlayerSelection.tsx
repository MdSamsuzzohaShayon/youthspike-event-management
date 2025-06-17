// components/match/PlayerSelection.tsx
'use client';

import React from 'react';

interface PlayerSelectionProps {
  teamAPlayers: any[];
  teamBPlayers: any[];
  playersOfSelectedNet: any;
  serverPlaceholder: boolean;
  receiverPlaceholder: boolean;
  handleServerSelection: (e: React.SyntheticEvent, playerId: string | undefined) => void;
  handleReceiverSelection: (e: React.SyntheticEvent, playerId: string | undefined) => void;
  handleClosePlayers: (e: React.SyntheticEvent) => void;
}

const PlayerSelection: React.FC<PlayerSelectionProps> = ({
  teamAPlayers,
  teamBPlayers,
  playersOfSelectedNet,
  serverPlaceholder,
  receiverPlaceholder,
  handleServerSelection,
  handleReceiverSelection,
  handleClosePlayers,
}) => {
 
  const renderTeamA = () => {
    const playersMap = new Map(teamAPlayers.map((p) => [p._id, p]));
    const playerA = playersMap.get(playersOfSelectedNet?.teamAPlayerA || '');
    const playerB = playersMap.get(playersOfSelectedNet?.teamAPlayerB || '');

    return (
      <div>
        <h4>Team A</h4>
        <ul>
          <li role="presentation" onClick={(e) => (serverPlaceholder ? handleServerSelection(e, playerA?._id) : handleReceiverSelection(e, playerA?._id))}>
            {playerA?.firstName} {playerA?.lastName}
          </li>
          <li role="presentation" onClick={(e) => (serverPlaceholder ? handleServerSelection(e, playerB?._id) : handleReceiverSelection(e, playerB?._id))}>
            {playerB?.firstName} {playerB?.lastName}
          </li>
        </ul>
      </div>
    );
  };

  const renderTeamB = () => {
    const playersMap = new Map(teamBPlayers.map((p) => [p._id, p]));
    const playerA = playersMap.get(playersOfSelectedNet?.teamBPlayerA || '');
    const playerB = playersMap.get(playersOfSelectedNet?.teamBPlayerB || '');

    return (
      <div>
        <h4>Team B</h4>
        <ul>
          <li role="presentation" onClick={(e) => (serverPlaceholder ? handleServerSelection(e, playerA?._id) : handleReceiverSelection(e, playerA?._id))}>
            {playerA?.firstName} {playerA?.lastName}
          </li>
          <li role="presentation" onClick={(e) => (serverPlaceholder ? handleServerSelection(e, playerB?._id) : handleReceiverSelection(e, playerB?._id))}>
            {playerB?.firstName} {playerB?.lastName}
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="display-server-receiver">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">Select a {serverPlaceholder ? "server" : (receiverPlaceholder ? "receiver" : "")}</h3>
      {playersOfSelectedNet && (
        <div className="team-players mt-4">
          <img src="/icons/close.svg" className="svg-white" role="presentation" onClick={handleClosePlayers} />
          {renderTeamA()}
          {renderTeamB()}
        </div>
      )}
    </div>
  );
};

export default PlayerSelection;