/* eslint-disable react/require-default-props */
import React, { useEffect, useMemo, useState } from 'react';
import { ETeam, IPlayer, IRoundRelatives } from '@/types';
import { useAppSelector } from '@/redux/hooks';
import { sortPlayerRanking } from '@/utils/helper';
import PlayerScoreCard from './PlayerScoreCard';
import Link from 'next/link';

interface ITeamPlayersProps {
  teamPlayers: IPlayer[];
  roundList: IRoundRelatives[];
  screenWidth: number;
  onTop?: boolean;
  teamE: ETeam;
}

function TeamPlayers({ teamPlayers, screenWidth, roundList, onTop, teamE }: ITeamPlayersProps) {
  const { myTeamE } = useAppSelector((state) => state.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

  /**
   * ✅ Memoized sorted players (no duplicate loop, Set used inline).
   * Complexity: O(n log n) (from sort), duplicates removed in a single pass.
   */
  const sortedPlayers = useMemo(() => {
    if (!teamPlayers || (!teamAPlayerRanking && !teamBPlayerRanking)) return [];

    let rankings = teamE === ETeam.teamA ? (teamAPlayerRanking?.rankings || []) : (teamBPlayerRanking?.rankings || []);

    const { sortedPlayers: sortedPlayerList } = sortPlayerRanking(teamPlayers, rankings);

    

    const seen = new Set<string>();
    return sortedPlayerList.filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [teamPlayers, teamAPlayerRanking, teamBPlayerRanking]);

  /**
   * ✅ Memoized subbed players map
   * Avoids spreading arrays on every insertion → pushes directly.
   * Complexity: O(m) (m = total subs across rounds).
   */
  const subbedPlayers = useMemo(() => {
    if (!roundList || roundList.length === 0) return new Map<string, number[]>();

    const subsMap = new Map<string, number[]>();
    for (const { subs, num } of roundList) {
      if (!subs) continue;
      for (const player of subs) {
        if (!subsMap.has(player)) subsMap.set(player, []);
        subsMap.get(player)!.push(num);
      }
    }
    return subsMap;
  }, [roundList]);

  return (
    <div className="py-4">
      <div className="container px-4 mx-auto">
        <div
          className={`player-list flex ${
            onTop ? 'items-end' : 'items-start'
          } justify-between overflow-x-auto gap-x-1`}
        >
          {sortedPlayers.map((player) => (
            <Link href={`/players/${player._id}`} className="player-card w-20 flex-shrink-0" key={player._id}>
              <PlayerScoreCard
                player={player}
                onTop={onTop}
                screenWidth={screenWidth}
                subbedRounds={subbedPlayers.get(player._id)}
                myTeamE={myTeamE}
                tapr={teamAPlayerRanking}
                tbpr={teamBPlayerRanking}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamPlayers;
