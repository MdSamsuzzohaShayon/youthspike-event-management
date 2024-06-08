/* eslint-disable react/require-default-props */
import { IPlayer, IRoundRelatives } from '@/types';
import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import SubbedPlayerCard from './SubbedPlayerCard';

interface ISubbedPlayerProps {
  teamPlayers: IPlayer[];
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  subControl?: boolean;
}

function SubbedPlayerList({ teamPlayers, subControl, currRound, roundList }: ISubbedPlayerProps) {
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);
  return (
    <div className="subbed w-full players-wrapper">
      <h2>Subbed Players</h2>
      <div className="subbed-player-list w-full flex flex-wrap justify-start gap-2">
        {teamPlayers.map((p) => (
          <SubbedPlayerCard
            player={p}
            key={p._id}
            currRound={currRound}
            roundList={roundList}
            subControl={subControl}
            teamAPlayerRanking={teamAPlayerRanking}
            teamBPlayerRanking={teamBPlayerRanking}
          />
        ))}
      </div>
    </div>
  );
}

export default SubbedPlayerList;
