/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import { IPlayer } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { useAppSelector } from '@/redux/hooks';
import { sortPlayerRanking } from '@/utils/helper';
import PlayerScoreCard from './PlayerScoreCard';

interface ITeamPlayersProps {
  teamPlayers: IPlayer[];
  screenWidth: number;
  onTop?: boolean;
}

function TeamPlayers({ teamPlayers, screenWidth, onTop }: ITeamPlayersProps) {
  const [sortedPlayers, setSortedPlayers] = useState<IPlayer[]>([]);
  // Global States
  const { myTeamE } = useAppSelector((state) => state.matches);

  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

  // Rank players in ascending order
  useEffect(() => {
    if (teamPlayers && (teamAPlayerRanking || teamBPlayerRanking)) {
      const rankings = [];
      if (teamAPlayerRanking && teamAPlayerRanking.rankings) {
        rankings.push(...teamAPlayerRanking.rankings);
      }
      if (teamBPlayerRanking && teamBPlayerRanking.rankings) {
        rankings.push(...teamBPlayerRanking.rankings);
      }
      const { sortedPlayers: sortedPlayerList } = sortPlayerRanking(teamPlayers, rankings);
      setSortedPlayers(sortedPlayerList);
    }
  }, [teamAPlayerRanking, teamBPlayerRanking, teamPlayers]);

  return (
    <div className="bg-black-logo text-white py-4">
      <div className="container px-4 mx-auto">
        <div className="player-list flex items-center justify-between overflow-x-auto gap-x-1">
          {sortedPlayers.map((player) => (
            <div className="player-card w-20 flex-shrink-0" key={player._id}>
              <PlayerScoreCard player={player} onTop={onTop} teamPlayer={ETeamPlayer.TA_PA} screenWidth={screenWidth} myTeamE={myTeamE} tapr={teamAPlayerRanking} tbpr={teamBPlayerRanking} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamPlayers;
