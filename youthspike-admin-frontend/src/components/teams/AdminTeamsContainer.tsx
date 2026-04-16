'use client'

import { IGetTeamsResponse, ITeam } from '@/types';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import TeamTable from './TeamTable';
import { notFound } from 'next/navigation';
import { useCallback, useState } from 'react';
import { GET_TEAMS_MIN } from '@/graphql/teams';

const TEAMS_LIMIT = 30;

function TeamsContainer({ queryRef }: { queryRef: QueryRef<{ getTeams: IGetTeamsResponse }> }) {
    const { data, error } = useReadQuery(queryRef);
    console.log(data);
    console.error(error);


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
        <div className="min-h-screen px-6 py-10 md:px-16">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center mb-6">Teams</h2>

                <div className="overflow-hidden shadow-lg rounded-lg border border-gray-700">
                    <TeamTable teams={teams} />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-400">Stay updated with the latest events!</p>
                </div>
            </div>

            {/* Load More Button */}
            {hasMoreTeams && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-md hover:bg-yellow-400 disabled:bg-yellow-700 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isLoadingMore ? (
                            <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                                Loading...
                            </span>
                        ) : (
                            `Load More Teams`
                        )}
                    </button>
                </div>
            )}

        </div>
    )
}

export default TeamsContainer;