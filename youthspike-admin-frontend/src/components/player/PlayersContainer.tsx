'use client'

import { IGetPlayersResponse } from '@/types';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import PlayerTable from './PlayerTable';
import { notFound } from 'next/navigation';
import { useCallback, useState } from 'react';
import { GET_PLAYERS_MIN } from '@/graphql/players';

const PLAYERS_LIMIT = 30;

function PlayersContainer({ queryRef }: { queryRef: QueryRef<{ getPlayers: IGetPlayersResponse }> }) {
    const { data } = useReadQuery(queryRef);
    const apolloClient = useApolloClient();

    const [hasMorePlayers, setHasMorePlayers] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [currentOffset, setCurrentOffset] = useState(PLAYERS_LIMIT);

    const players = data?.getPlayers?.data;

    if (!players) notFound();


    // Execute GraphQL query
    const executeSearchQuery = useCallback(
        async (offset: number = 0) => {
            const result = await apolloClient.query({
                query: GET_PLAYERS_MIN,
                variables: { limit: PLAYERS_LIMIT, offset },
                fetchPolicy: 'network-only',
            });

            return result.data.getPlayers;
        },
        [apolloClient],
    );


    // Load more players
    const handleLoadMore = useCallback(async () => {
        if (!hasMorePlayers || isLoadingMore) return;

        setIsLoadingMore(true);
        const newOffset = currentOffset + PLAYERS_LIMIT;

        try {
            const response = await executeSearchQuery(newOffset);
            const newPlayers = response?.data || [];

            if (newPlayers.length > 0) {
                // ✅ 🔥 MANUAL CACHE UPDATE
                apolloClient.cache.modify({
                    fields: {
                        getPlayers(existing: IGetPlayersResponse | undefined) {
                            if (!existing) return existing;

                            return {
                                ...existing,
                                data: [
                                    ...(existing.data || []),
                                    ...newPlayers,
                                ],
                            };
                        },
                    },
                });

                setCurrentOffset(newOffset);
                // Check if there are more players
                setHasMorePlayers(newPlayers.length === PLAYERS_LIMIT);
            } else {
                setHasMorePlayers(false);
            }
        } catch (error) {
            console.error('Failed to load more players:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMorePlayers, isLoadingMore, currentOffset, executeSearchQuery]);

    return (
        <div className="min-h-screen px-6 py-10 md:px-16">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center mb-6">Players</h2>

                <div className="overflow-hidden shadow-lg rounded-lg border border-gray-700">
                    <PlayerTable players={players} />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-400">Stay updated with the latest events!</p>
                </div>
            </div>

            {/* Load More Button */}
            {hasMorePlayers && (
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
                            `Load More Players`
                        )}
                    </button>
                </div>
            )}

        </div>
    )
}

export default PlayersContainer;