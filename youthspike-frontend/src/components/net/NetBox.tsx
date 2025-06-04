import React, { useMemo } from 'react';
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

function NetBox({ myTeamE, crn, teamPlayerList, netTitle }: INetBoxProps) {

  const teamAPlayerRanking = useAppSelector((state) => state.playerRanking.teamAPlayerRanking);
  const teamBPlayerRanking = useAppSelector((state) => state.playerRanking.teamBPlayerRanking);
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);

  // Create maps for quick access
  const playerMap = useMemo(() => {
    const map = new Map<string, IPlayer>();
    for (const player of teamPlayerList) {
      map.set(player._id, player);
    }
    return map;
  }, [teamPlayerList]);

  const rankingMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of teamAPlayerRanking?.rankings ?? []) {
      map.set(r.player._id, r.rank);
    }
    for (const r of teamBPlayerRanking?.rankings ?? []) {
      map.set(r.player._id, r.rank);
    }
    return map;
  }, [teamAPlayerRanking?.rankings, teamBPlayerRanking?.rankings]);

  const playerAId = myTeamE === ETeam.teamA ? crn.teamAPlayerA : crn.teamBPlayerA;
  const playerBId = myTeamE === ETeam.teamA ? crn.teamAPlayerB : crn.teamBPlayerB;

  const playerA = playerAId ? playerMap.get(playerAId) ?? null : null;
  const playerB = playerBId ? playerMap.get(playerBId) ?? null : null;

  const playerARank = playerA?._id ? rankingMap.get(playerA._id) ?? 0 : 0;
  const playerBRank = playerB?._id ? rankingMap.get(playerB._id) ?? 0 : 0;

  return (
    <div className="net-box w-full mb-4 flex justify-center items-center" key={crn._id}>
      <div className={`w-full md:w-3/6 border ${border.light}`}>
        <h4 className="text-center uppercase bg-gray-300 font-bold">{netTitle ?? `Net ${crn.num}`}</h4>
        <div className={`w-full flex justify-between items-center border-t ${border.light}`}>
          <div className="players w-4/6 p-1 text-start flex md:justify-center justify-between items-end">
            <div className="player-wrapper w-6/12 md:w-4/12 xl:w-3/12 px-1">
              <PlayerScoreCard onTop player={playerA} screenWidth={screenWidth} myTeamE={myTeamE} tapr={teamAPlayerRanking} tbpr={teamBPlayerRanking} />
            </div>
            <div className="player-wrapper w-6/12 md:w-4/12 xl:w-3/12 px-1">
              <PlayerScoreCard onTop player={playerB} screenWidth={screenWidth} myTeamE={myTeamE} tapr={teamAPlayerRanking} tbpr={teamBPlayerRanking} />
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
}

export default NetBox;
