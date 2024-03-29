import { IPlayer, IPlayerExpRel } from '@/types';
import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import PlayerCard from './PlayerCard';
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';
import useScreenWidth from '../../../hooks/useScreenWidth';

interface ISortableListProps {
    playerList: IPlayerExpRel[];
    eventId: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IPlayerRank {
    _id: string;
    rank: number;
}

const SortableList: React.FC<ISortableListProps> = ({ playerList, eventId, setIsLoading }) => {
    const listRef = useRef<HTMLUListElement>(null);
    const screenWidth = useScreenWidth();

    const [rankPlayers, { data, error, loading, client }] = useMutation(UPDATE_PLAYERS);

    // ====== Handle Events =====
    const handleUpdate = async (upr: IPlayerRank[]) => { // upr = update player ranking
        // if (!rankControls) return;
        if (upr.length > 0) {
            try {
                await rankPlayers({ variables: { input: upr } });
                // if (refetchFunc) await refetchFunc();
                // if (setAddPlayer) setAddPlayer(false);
            } catch (error) {
                console.log(error);
            }
        }
    }

    const handleSortEnd = async (evt: Sortable.SortableEvent) => {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;

        if (oldIndex !== undefined && newIndex !== undefined) {
            // Clone the array to avoid mutating the original state directly
            const activeList = [...playerList.filter((p) => p.status === EPlayerStatus.ACTIVE)];

            // Rearrange the list based on the new indices
            const [movedItem] = activeList.splice(oldIndex, 1);
            activeList.splice(newIndex, 0, movedItem);

            // Recalculate the ranks based on the new order
            const updatedRanking: { _id: string; rank: number }[] = [];
            activeList.forEach((player, index) => {
                updatedRanking.push({ _id: player._id, rank: index + 1 });
            });

            await handleUpdate(updatedRanking);
        }
    };

    useEffect(() => {
        let sortableList: Sortable | null = null;
        if (screenWidth <= 768) { // Adjust behavior based on screen width
            sortableList = Sortable.create(listRef.current!, {
                animation: 150,
                easing: "cubic-bezier(1, 0, 0, 1)",
                delay: 200, // Delay in milliseconds before sorting starts
                touchStartThreshold: 100, // Minimum distance in pixels to start sorting
                onStart: function (evt) {
                    // Workaround to prevent default behavior of long press on iOS
                    evt.preventDefault();
                },
                onEnd: handleSortEnd,
            });
        } else {
            sortableList = Sortable.create(listRef.current!, {
                animation: 150,
                easing: "cubic-bezier(1, 0, 0, 1)",
                onEnd: handleSortEnd,
            });
        }
        return () => {
            if (sortableList) {
                sortableList.destroy();
            }
        };
    }, [playerList, screenWidth]); // Re-run effect when playerList or screenWidth changes


    return (
        <ul ref={listRef} className='w-full'>
            {playerList.map((player: IPlayerExpRel, index: number) => (
                <li key={index} className="sortable-item mb-2">
                    <PlayerCard key={index} eventId={eventId} player={player} setIsLoading={setIsLoading} showRank />
                </li>
            ))}
        </ul>
    );
};

export default SortableList;
