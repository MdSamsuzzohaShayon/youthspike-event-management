// components/KeepTeamPlayers.tsx
import React from 'react';
import { IPlayer } from '@/types';

interface KeepTeamPlayersProps {
  teamName: string;
  players: (IPlayer | undefined)[];
  onPlayerSelect: (playerId: string) => void;
}

const KeepTeamPlayers: React.FC<KeepTeamPlayersProps> = ({ teamName, players, onPlayerSelect }) => (
  <div className="mb-4">
    <h4 className="font-semibold">{teamName}</h4>
    <ul className="space-y-2">
      {players.map((player, index) => (
        player && (
          <li 
            key={player._id || index}
            className="cursor-pointer hover:text-yellow-400"
            onClick={() => onPlayerSelect(player._id)}
          >
            {player.firstName} {player.lastName}
          </li>
        )
      ))}
    </ul>
  </div>
);

export default KeepTeamPlayers;