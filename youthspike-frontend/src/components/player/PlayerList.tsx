/* eslint-disable react/require-default-props */
import { IMatchExpRel, IPlayer, IPlayerRecord } from '@/types';
import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { calcRoundScore } from '@/utils/scoreCalc';
import { ETeam } from '@/types/team';
import PlayerCard from './PlayerCard';

interface IPlayerListProps {
  showRank?: boolean;
  playerList?: IPlayer[];
  matchList?: IMatchExpRel[];
}

function PlayerList({ showRank, playerList = [], matchList = [] }: IPlayerListProps) {
  const [playerRecords, setPlayerRecords] = useState<Map<string, IPlayerRecord>>(new Map());
  const { rankingMap } = useAppSelector((state) => state.playerRanking);
  const newRankingMap = new Map(rankingMap);

  // Helper function to initialize or update player records
  const updatePlayerRecord = (records: Map<string, IPlayerRecord>, playerId: string, type: 'running' | 'wins' | 'losses') => {
    const currentRecord = records.get(playerId) || { running: 0, wins: 0, losses: 0 };
    currentRecord[type] += 1;
    records.set(playerId, currentRecord);
  };

  // Helper function to calculate scores for a team
  const calculateScores = (rounds: IMatchExpRel['rounds'], nets: IMatchExpRel['nets'], teamE: ETeam): { teamScore: number; opponentScore: number } => {
    let mts = 0;
    let ots = 0;
    rounds.forEach(
      (round) => {
        // @ts-ignore
        const netsOfThisRound = nets.filter((net) => net.round._id === round._id);
        // @ts-ignore
        const { score: teamScore } = calcRoundScore(netsOfThisRound, round, teamE);
        // @ts-ignore
        const { score: opponentScore } = calcRoundScore(netsOfThisRound, round, teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA);
        mts += teamScore;
        ots += opponentScore;
      },
      { teamScore: 0, opponentScore: 0 },
    );

    return { teamScore: mts, opponentScore: ots };
  };

  useEffect(() => {
    if (!matchList.length || !playerList.length) return;

    const newPlayerRecords = new Map<string, IPlayerRecord>();

    playerList.forEach((player) => {
      if (!player?.teams?.length) return;

      const playerTeamIds = player.teams.map((team) => team._id);

      matchList.forEach((match) => {
        const isTeamA = playerTeamIds.includes(match.teamA._id);
        const isTeamB = playerTeamIds.includes(match.teamB._id);

        if (!isTeamA && !isTeamB) return;

        const { teamScore, opponentScore } = calculateScores(match.rounds, match.nets, isTeamA ? ETeam.teamA : ETeam.teamB);

        if (!match.completed) {
          updatePlayerRecord(newPlayerRecords, player._id, 'running');
        } else if (teamScore > opponentScore) {
          updatePlayerRecord(newPlayerRecords, player._id, 'wins');
        } else if (teamScore < opponentScore) {
          updatePlayerRecord(newPlayerRecords, player._id, 'losses');
        }
      });
    });

    setPlayerRecords(newPlayerRecords);
  }, [matchList, playerList]);

  return (
    <div className="playerList w-full flex flex-col gap-1">
      {playerList.map((player) => (
        <PlayerCard key={player._id} rank={showRank ? newRankingMap.get(player._id) ?? null : null} player={player} playerRecord={playerRecords.get(player._id)} />
      ))}
    </div>
  );
}

export default PlayerList;
