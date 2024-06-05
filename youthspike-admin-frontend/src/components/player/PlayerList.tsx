import { IError, IOption, IPlayerExpRel, ITeam } from '@/types';
import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';

interface IPlayerListProps {
  playerList: IPlayerExpRel[];
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList?: IOption[];
  showRank?: boolean;
  teamList?: ITeam[];
  rankControls?: boolean;
  teamId?: string;
  refetchFunc?: () => void;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

interface IPlayerRank {
  _id: string;
  rank: number;
}

function PlayerList({ playerList, eventId, setIsLoading, rankControls, refetchFunc, teamList, showRank, divisionList, teamId, setActErr }: IPlayerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const screenWidth = useScreenWidth();

  const [rankPlayers] = useMutation(UPDATE_PLAYERS);

  // ====== Handle Events =====
  const handleUpdate = async (upr: IPlayerRank[]) => {
    // upr = update player ranking
    // if (!rankControls) return;
    if (upr.length > 0) {
      try {
        setIsLoading(true);
        await rankPlayers({ variables: { input: upr } });
        if (refetchFunc) await refetchFunc();
        // if (setAddPlayer) setAddPlayer(false);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSortEnd = async (evt: Sortable.SortableEvent) => {
    const { oldIndex } = evt;
    const { newIndex } = evt;

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
    if (listRef && rankControls) {
      if (screenWidth <= 768) {
        // Adjust behavior based on screen width
        sortableList = Sortable.create(listRef.current!, {
          animation: 150,
          easing: 'cubic-bezier(1, 0, 0, 1)',
          delay: 200, // Delay in milliseconds before sorting starts
          touchStartThreshold: 100, // Minimum distance in pixels to start sorting
          onStart(evt) {
            // Workaround to prevent default behavior of long press on iOS
            evt.preventDefault();
          },
          onEnd: handleSortEnd,
        });
      } else {
        sortableList = Sortable.create(listRef.current!, {
          animation: 150,
          easing: 'cubic-bezier(1, 0, 0, 1)',
          onEnd: handleSortEnd,
        });
      }
    }
    return () => {
      if (sortableList) {
        sortableList.destroy();
      }
    };
  }, [playerList, screenWidth]); // Re-run effect when playerList or screenWidth changes

  return (
    <ul ref={listRef} className="w-full">
      {playerList.map((player: IPlayerExpRel) => (
        <li key={player._id} className="sortable-item mb-2">
          <PlayerCard
            eventId={eventId}
            player={player}
            setIsLoading={setIsLoading}
            showRank={showRank}
            teamList={teamList}
            divisionList={divisionList}
            refetchFunc={refetchFunc}
            rankControls={rankControls}
            teamId={teamId}
            setActErr={setActErr}
          />
        </li>
      ))}
    </ul>
  );
}

export default PlayerList;
