// components/player/PlayersMainContainer.tsx
'use client';

import { useReadQuery } from '@apollo/client';
import { QueryRef } from '@apollo/client';
import PlayersMain from './PlayersMain';
import { IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IPlayerRankingItem, IPlayerRankingItemExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { notFound, redirect } from 'next/navigation';
import { UNAUTHORIZED } from '@/utils/constant';
import { useMemo } from 'react';

interface IEventPlayersGroupsTeamsResponse {
  getEventWithPlayers: {
    data: {
      event: any;
      players: IPlayerExpRel[];
      groups: any[];
      teams: ITeam[];
      playerRankings: IPlayerRanking[];
      rankings: IPlayerRankingItem[];
    };
  };
}

interface IPlayersMainContainerProps {
  queryRef: QueryRef<IEventPlayersGroupsTeamsResponse>;
  eventId: string;
  userExist: any; // Replace with proper user type
}

function PlayersMainContainer({ queryRef, eventId, userExist }: IPlayersMainContainerProps) {
  const { data } = useReadQuery(queryRef);

  // Handle GraphQL errors
  if (!data?.getEventWithPlayers) {
    return <div>Event not found</div>;
  }

  const { event, players, groups, teams, playerRankings, rankings } = data.getEventWithPlayers.data;

  // Build Maps once for quick lookup
  const teamMap = useMemo(() => {
    return new Map<string, ITeam>(teams.map((t: ITeam) => [t._id, t]));
  }, [teams]);
  const playerMap = useMemo(() => {
    return new Map<string, IPlayerExpRel>(players.map((p: IPlayerExpRel) => [p._id, p]));
  }, [players]);

  const captainPlayerId = userExist?.info?.role === UserRole.captain ? userExist.info.captainplayer : userExist?.info?.role === UserRole.co_captain ? userExist.info.cocaptainplayer : null;

  // Show only players of captain's team if logged in as captain or co-captain
  let playerRanking: IPlayerRankingExpRel | null = null;

  if (captainPlayerId) {
    const captain = playerMap.get(captainPlayerId);
    if (!captain) {
      notFound();
    }

    const teamId = captain.teams && captain.teams.length > 0 ? (typeof captain.teams[0] === 'string' ? captain.teams[0] : captain.teams[0]._id) : null;

    if (!teamId || !teamMap.has(teamId)) {
      notFound();
    }


    if (playerRankings.length > 0) {
      const foundRanking = playerRankings.find((pr: IPlayerRanking) =>
        pr.team === teamId && pr.rankLock === 0
      );

      if (foundRanking) {
        const filteredRankings = rankings.length > 0
          ? rankings.filter((r: IPlayerRankingItem) => r.playerRanking === foundRanking._id)
          : [];
        
        playerRanking = {
          ...foundRanking,
          rankings: filteredRankings as unknown as IPlayerRankingItemExpRel[],
          team: teamMap.get(teamId)!,
          match: undefined, // match is string in IPlayerRanking but IMatch in IPlayerRankingExpRel, so set to undefined
        };
      }
    }
  }

  // Assign a single team object (first team) to each player
  const playerList = useMemo(() => {
    const list = [];
    for (let i = 0; i < players.length; i++) {
      const player = { ...players[i] };
      if (player.teams && player.teams.length > 0) {
        const teamsOfPlayer = [];
        for (let j = 0; j < player.teams.length; j++) {
          const teamId = player.teams[j];
          if (teamMap.has(String(teamId))) {
            teamsOfPlayer.push(teamMap.get(String(teamId)) as ITeam);
          }
        }
        player.teams = teamsOfPlayer;
      }
      list.push(player);
    }
    return list;
  }, [players]);

  return <PlayersMain currEvent={event} players={playerList} groups={groups} teams={teams} playerRanking={playerRanking} />;
}

export default PlayersMainContainer;
