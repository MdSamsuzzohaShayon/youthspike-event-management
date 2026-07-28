'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { useReadQuery, QueryRef } from '@apollo/client/react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import {
  IPlayer,
  IPlayerRank,
  IGetTeamRosterResponse,
  IPlayerRankingExpRel,
  IEventRelatives,
  IBadge,
  ITeam,
  EPlayerStatus,
  UserRole,
  IPlayerRankingItem,
  IPlayerRankingItemExpRel,
} from '@/types';

import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import SessionStorageService from '@/utils/SessionStorageService';
import { TEAM } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { createBadgeMap } from '@/utils/badge/badge-helpers';

import TeamNavigation from './TeamNavigation';
import PlayerList from '../player/PlayerList';
import BadgeTable from '../badge/BadgeTable';
import { attachRanksAndSort, buildPlayerRankingWithRankings, buildRankByPlayerId, canUserChangeTeamRanking, clearPersistedTeamId, partitionPlayersByRankingAndStatus, persistCurrentTeamId } from '@/utils/team/roster-helpers';

interface ITeamRosterContainerProps {
  queryRef: QueryRef<{ getTeamRoster: IGetTeamRosterResponse }>;
  teamId: string;
}





interface IRosterSectionProps {
  title: string;
  subtitle?: string;
  countBadge?: number;
  headerAction?: ReactNode;
  players: IPlayer[];
  events: IEventRelatives[];
  badgeMap: Map<string, IBadge>;
}

/** Shared layout for the active/inactive player lists — keeps the markup DRY. */
function RosterSection({
  title,
  subtitle,
  countBadge,
  headerAction,
  players,
  events,
  badgeMap,
}: IRosterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {headerAction}
        {countBadge !== undefined && (
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
            {countBadge}
          </span>
        )}
      </div>
      <PlayerList players={players} events={events} badgeMap={badgeMap} />
    </div>
  );
}

/** Decorative animated background blobs — purely presentational. */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
}

function TeamRosterContainer({ queryRef }: ITeamRosterContainerProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  const { data } = useReadQuery(queryRef);

  const rosterData = data?.getTeamRoster?.data;
  if (!rosterData) notFound();

  const { team, players, events, playerRanking, badges } = rosterData;
  if (!team) notFound();

  // Cast once, close to the source, instead of repeating it at every call site below.
  const rankings = rosterData.rankings as IPlayerRankingItemExpRel[] | undefined;

  const { activePlayers, inactivePlayers } = useMemo(
    () => partitionPlayersByRankingAndStatus(players, rankings, team._id),
    [players, rankings, team._id],
  );

  const badgeMap = useMemo(() => createBadgeMap(badges ?? []), [badges]);

  const rankedActivePlayers = useMemo(() => {
    const rankByPlayerId = buildRankByPlayerId(rankings);
    return attachRanksAndSort(activePlayers, rankByPlayerId);
  }, [activePlayers, rankings]);

  // const playerRankingData: IPlayerRankingExpRel | null = useMemo(
  //   () => buildPlayerRankingWithRankings(playerRanking, rankings) as IPlayerRankingExpRel | null,
  //   [playerRanking, rankings],
  // );

  const canRank = useMemo(() => canUserChangeTeamRanking(user, team), [user, team]);

  const teamEvents = useMemo(
    () => (events ?? []).filter((event) => (event?.teams || []).includes(team._id)),
    [events, team._id],
  );

  useEffect(() => {
    persistCurrentTeamId(team._id);
    return () => clearPersistedTeamId();
  }, [team._id]);

  return (
    <div className="min-h-screen">
      <AmbientBackground />

      <TeamNavigation
        events={events}
        ldoIdUrl={ldoIdUrl}
        team={team}
        badge={team.badge ? badgeMap.get(String(team.badge)) : null}
        totalPlayers={activePlayers.length + inactivePlayers.length}
      />

      <div className="relative z-10">
        <div className="animate-fadeInUp space-y-3">
          <RosterSection
            title="Team Roster"
            subtitle={`${activePlayers.length} active players`}
            headerAction={
              canRank && (
                <div className="py-3 px-3 text-center">
                  <Link
                    href={`${ADMIN_FRONTEND_URL}/teams/${team._id}/roster/${ldoIdUrl}`}
                    className="btn-info"
                  >
                    Change ranking
                  </Link>
                </div>
              )
            }
            players={rankedActivePlayers}
            events={teamEvents}
            badgeMap={badgeMap}
          />

          {inactivePlayers.length > 0 && (
            <RosterSection
              title="Inactive Players"
              countBadge={inactivePlayers.length}
              players={inactivePlayers}
              events={teamEvents}
              badgeMap={badgeMap}
            />
          )}
        </div>
      </div>

      <div className="w-full mt-6">
        <h2>Badges</h2>
        <BadgeTable badges={badges ?? []} />
      </div>
    </div>
  );
}

export default TeamRosterContainer;