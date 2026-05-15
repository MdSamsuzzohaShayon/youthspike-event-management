'use client'

import { IEvent, IGetTeamsResponse, ITeam } from '@/types';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import TeamTable from './TeamTable';
import { notFound } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { GET_TEAMS_MIN } from '@/graphql/teams';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import Image from 'next/image';

const TEAMS_LIMIT = 30;

function TeamsContainer({ queryRef }: { queryRef: QueryRef<{ getTeams: IGetTeamsResponse }> }) {
    const { data, error } = useReadQuery(queryRef);
    const {ldoIdUrl} = useLdoId();

    if (error) console.error(error);


    const apolloClient = useApolloClient();

    const [hasMoreTeams, setHasMoreTeams] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [currentOffset, setCurrentOffset] = useState(TEAMS_LIMIT);

    const teams = data?.getTeams?.data;
    

    if (!teams) notFound();


    // Execute GraphQL query
    const executeSearchQuery = useCallback(
        async (offset: number = 0) => {
            const result = await apolloClient.query<{ getTeams: IGetTeamsResponse }>({
                query: GET_TEAMS_MIN,
                variables: { limit: TEAMS_LIMIT, offset },
                fetchPolicy: 'network-only',
            });

            return result.data?.getTeams;
        },
        [apolloClient],
    );


    // Load more teams
    const handleLoadMore = useCallback(async () => {
        if (!hasMoreTeams || isLoadingMore) return;

        setIsLoadingMore(true);
        const newOffset = currentOffset + TEAMS_LIMIT;

        try {
            const response = await executeSearchQuery(newOffset);
            const newTeams = response?.data || [];

            if (newTeams.length > 0) {
                // ✅ 🔥 MANUAL CACHE UPDATE
                apolloClient.cache.modify<{ getTeams: IGetTeamsResponse }>({
                    fields: {
                        getTeams(existing, { readField, isReference }) {
                            if (!existing) return existing;
                            if (isReference(existing)) {
                                const prev = readField<ITeam[]>('data', existing) ?? [];
                                return {
                                    __typename: readField('__typename', existing),
                                    success: readField('success', existing),
                                    code: readField('code', existing),
                                    message: readField('message', existing),
                                    data: [...prev, ...newTeams],
                                };
                            }
                            return {
                                ...existing,
                                data: [...(existing.data ?? []), ...newTeams],
                            };
                        },
                    },
                });

                setCurrentOffset(newOffset);
                // Check if there are more teams
                setHasMoreTeams(newTeams.length === TEAMS_LIMIT);
            } else {
                setHasMoreTeams(false);
            }
        } catch (error) {
            console.error('Failed to load more teams:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMoreTeams, isLoadingMore, currentOffset, executeSearchQuery]);





    return (
        <div className="min-h-screen">
          {/* ── Hero header ────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden border-b border-yellow-400/20">
     
            <div className="relative mx-auto max-w-5xl px-6 py-14 md:px-12 md:py-20">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-1 font-mono text-xs uppercase tracking-[0.25em] text-yellow-logo">
                    Admin Dashboard
                  </p>
                  <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                    <span className="text-yellow-logo">Teams</span>
                  </h1>
                  <p className="mt-2 text-sm text-gray-400">
                    {teams.length} team{teams.length !== 1 ? 's' : ''} loaded
                  </p>
                </div>
     
                <Link
                  href={`/teams/new/${ldoIdUrl}`}
                  className="btn-info flex justify-center items-center"
                >
                  {/* shimmer */}
                  <Image width={20} height={20} className='2-6 h-6 svg-black' src="/icons/plus.svg" alt="add-team" />
                  <span className="relative">New Team</span>
                </Link>
              </div>
            </div>
          </div>
     
          {/* ── Main content ───────────────────────────────────────────────────── */}
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-12">
            {/* card wrapper with golden border accent */}
            <div className="relative rounded-2xl border border-white/[0.07] bg-[#111111] shadow-2xl ring-1 ring-yellow-400/10">
              {/* top accent bar */}
              <div className="h-px w-full rounded-t-2xl bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
     
              <div className="overflow-hidden rounded-2xl">
                <TeamTable teams={teams} />
              </div>
            </div>
     
            {/* ── Load More ──────────────────────────────────────────────────── */}
            {hasMoreTeams && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="group relative overflow-hidden rounded-full border border-yellow-400/40 bg-transparent px-10 py-3 font-semibold text-yellow-400 transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-yellow-400 transition-transform duration-300 group-hover:translate-x-0"
                  />
                  <span className="relative flex items-center gap-2">
                    {isLoadingMore ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading…
                      </>
                    ) : (
                      'Load More Teams'
                    )}
                  </span>
                </button>
              </div>
            )}
     
            {/* ── Footer note ────────────────────────────────────────────────── */}
            {!hasMoreTeams && (
              <p className="mt-8 text-center font-mono text-xs text-gray-600 uppercase tracking-widest">
                All teams loaded
              </p>
            )}
          </div>
        </div>
      );
    
}

export default TeamsContainer;