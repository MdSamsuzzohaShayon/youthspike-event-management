import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { INetRelatives, IPlayer } from '@/types';
import { ETeam } from '@/types/team';
import { border } from '@/utils/styles';
import PlayerScoreCard from '../player/PlayerScoreCard';

interface INetBoxProps {
  crn: INetRelatives;
  teamPlayerList: IPlayer[];
  myTeamE: ETeam;
  netTitle?: string;
}

const IdToPlayer = (playerId: string | null | undefined, teamPlayerList: IPlayer[]): IPlayer | null => {
  if (!playerId) return null;
  return teamPlayerList.find(p => p._id === playerId) || null;
};

const NetBox: React.FC<INetBoxProps> = ({ myTeamE, crn, teamPlayerList, netTitle }) => {
  const { teamAPlayerRanking, teamBPlayerRanking, screenWidth } = useAppSelector(state => ({
    teamAPlayerRanking: state.playerRanking.teamAPlayerRanking,
    teamBPlayerRanking: state.playerRanking.teamBPlayerRanking,
    screenWidth: state.elements.screenWidth,
  }));

  const playerA = IdToPlayer(
    myTeamE === ETeam.teamA ? crn.teamAPlayerA : crn.teamBPlayerA,
    teamPlayerList
  );

  const playerB = IdToPlayer(
    myTeamE === ETeam.teamA ? crn.teamAPlayerB : crn.teamBPlayerB,
    teamPlayerList
  );

  const rankings = [
    ...(teamAPlayerRanking?.rankings || []),
    ...(teamBPlayerRanking?.rankings || []),
  ];

  const playerARank = rankings.find(p => p.player._id === playerA?._id)?.rank || 0;
  const playerBRank = rankings.find(p => p.player._id === playerB?._id)?.rank || 0;

  return (
    <div className="net-box w-full mb-4 flex justify-center items-center" key={crn._id}>
      <div className={`w-full md:w-3/6 border ${border.light}`}>
        <h4 className="text-center uppercase bg-gray-300 font-bold">{ netTitle ?? "Net " + crn.num}</h4>
        <div className={`w-full flex justify-between items-center border-t ${border.light}`}>
          <div className="players w-4/6 p-1 text-start flex md:justify-center justify-between items-end">
            <div className="player-wrapper w-6/12 md:w-4/12 xl:w-3/12 px-1">
              <PlayerScoreCard
                onTop
                player={playerA}
                screenWidth={screenWidth}
                myTeamE={myTeamE}
                tapr={teamAPlayerRanking}
                tbpr={teamBPlayerRanking}
              />
            </div>
            <div className="player-wrapper w-6/12 md:w-4/12 xl:w-3/12 px-1">
              <PlayerScoreCard
                onTop
                player={playerB}
                screenWidth={screenWidth}
                myTeamE={myTeamE}
                tapr={teamAPlayerRanking}
                tbpr={teamBPlayerRanking}
              />
            </div>
          </div>
          <div className={`pair-score w-2/6 h-full p-1 border-l ${border.light}`}>
            <p>Pair Score</p>
            <p>{playerARank + playerBRank}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetBox;
