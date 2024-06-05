/* eslint-disable react/require-default-props */
import React from 'react';
import { IPlayer } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { useAppSelector } from '@/redux/hooks';
import PlayerScoreCard from './PlayerScoreCard';

interface ITeamPlayersProps {
  teamPlayers: IPlayer[];
  screenWidth: number;
  onTop?: boolean;
}

function TeamPlayers({ teamPlayers, screenWidth, onTop }: ITeamPlayersProps) {
  // Global States
  const { myTeamE } = useAppSelector((state) => state.matches);
 


  return (
    <div className="bg-black-logo text-white py-4">
      <div className="container px-4 mx-auto">
        <div className="player-list flex items-center justify-between overflow-x-auto gap-x-1">
          {teamPlayers.map((player) => (
            <div className="player-card w-20 flex-shrink-0" key={player._id}>
              <PlayerScoreCard player={player} onTop={onTop} teamPlayer={ETeamPlayer.TA_PA} screenWidth={screenWidth} myTeamE={myTeamE} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamPlayers;
