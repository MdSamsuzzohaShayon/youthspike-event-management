import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { motion } from 'motion/react';

import './PlayerList.css';
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';

import { IPlayerExpRel, IPlayerRankingExpRel, IEvent, IOption, ITeam, IPlayerRank } from '@/types';
import Image from 'next/image';
import { itemVariants } from '@/utils/animation';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYER_RANKING } from '@/graphql/player-ranking';
import { handleError, handleResponse } from '@/utils/handleError';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useError } from '@/lib/ErrorProvider';
import { isISODateString } from '@/utils/datetime';
import { setPlayerRankings } from '@/utils/localStorage';

interface IPlayerListProps {
  playerList: IPlayerExpRel[];
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList?: IOption[];
  showRank?: boolean;
  teamList?: ITeam[];
  rankControls?: boolean;
  teamId?: string | null;
  refetchFunc?: () => void;
  playerRanking?: IPlayerRankingExpRel | null;
  currEvent?: null | IEvent;
  inactive?: boolean;
}

interface IUpdateRank {
  player: string;
  rank: number;
}

const ITEMS_PER_PAGE = 20;

function PlayerList({ playerList, eventId, setIsLoading, rankControls, refetchFunc, teamList, showRank, divisionList, teamId, playerRanking, currEvent, inactive }: IPlayerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const isMounted = useRef<boolean>(false);
  const screenWidth = useScreenWidth();
  const user = useUser();
  const { setActErr } = useError();
  

  const [mutatePlayerRanking] = useMutation(UPDATE_PLAYER_RANKING);

  /** State **/
  const [checkedPlayers, setCheckedPlayers] = useState<Map<string, boolean>>(new Map());
  const [canRank, setCanRank] = useState<boolean>(false);
  const [players, setPlayers] = useState<IPlayerRank[]>([]);
  const [rankingsMap, setRankingsMap] = useState<Map<string, number>>(new Map());

  // Pagination elements
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = useMemo(() => Math.ceil(players.length / ITEMS_PER_PAGE), [players.length, ITEMS_PER_PAGE]);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  /** Handle checkbox */
  const handleSelectPlayer = (e: React.SyntheticEvent, matchId: string) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedMatches: Map<string, boolean> = new Map(checkedPlayers);
    if (inputEl.checked) {
      newCheckedMatches.set(matchId, true);
    } else {
      newCheckedMatches.set(matchId, false);
    }
    setCheckedPlayers(newCheckedMatches);
    // e.preventDefault();
  };

  const handleUpdate = async (upr: IUpdateRank[]) => {
    // upr = update player ranking
    // if (!rankControls) return;
    if (upr.length > 0) {
      try {
        const rankingRes = await mutatePlayerRanking({ variables: { teamId, input: upr } });

        const success = handleResponse({ response: rankingRes?.data?.updatePlayerRanking, setActErr });
        console.log({ success, rankingRes });
        // Update rank players with match id and team id
        // if (refetchFunc) await refetchFunc();
      } catch (error: any) {
        console.log(error);
        handleError({ error, setActErr });
      }
    }
  };

  const handleSortEnd = async (evt: Sortable.SortableEvent) => {
    const { oldIndex, newIndex } = evt;

    if (oldIndex !== undefined && newIndex !== undefined) {
      console.log(`Moved from ${oldIndex} to ${newIndex}`);

      // Moving player one index to another index
      let sortedPlayers = [...players];
      sortedPlayers = sortedPlayers.sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : 0));
      const [movedItem] = sortedPlayers.splice(oldIndex, 1);
      sortedPlayers.splice(newIndex, 0, movedItem);

      // Organizing data
      const updatedRanking: IUpdateRank[] = [];
      const newRankingsMap = new Map();
      const newRankedPlayers: IPlayerRank[] = [];
      sortedPlayers.forEach((player, index) => {
        updatedRanking.push({
          player: player._id,
          rank: index + 1,
        });
        newRankingsMap.set(player._id, index + 1);
        newRankedPlayers.push({ ...player, rank: index + 1 });
      });

      // Setting state
      setRankingsMap(newRankingsMap);
      setPlayers(newRankedPlayers); // This need to rank properly

      // Set it to local storage
      setPlayerRankings(updatedRanking); // To local storage

      await handleUpdate(updatedRanking);
    }
  };

  const handleContextMenu = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default context menu from showing
  };

  useEffect(() => {
    if (playerList.length > 0) {
      if (!isMounted.current && inactive && playerList) {
        if (players.length === 0) setPlayers(playerList);
        isMounted.current = true;
      }
      if (!isMounted.current && playerList && playerList.length > 0) {
        
        if (playerRanking) {
          const newRankingsMap = new Map();
          if (playerRanking && playerRanking.rankings.length > 0) {
            // console.log(playerRanking.rankings);

            playerRanking.rankings.forEach((pr) => {
              newRankingsMap.set(pr.player, pr.rank);
            });
          }
          setRankingsMap(newRankingsMap);
          const playersWithRank: IPlayerRank[] = [];
          playerList.forEach((p) => {
            playersWithRank.push({ ...p, rank: newRankingsMap.get(p._id) });
          });
          if (players.length === 0) setPlayers(playersWithRank);
          // console.log({ msg: "PlayerList when event mount: ", playersWithRank });
        } else {
          if (players.length === 0) setPlayers(playerList);
        }

        isMounted.current = true;
      }
    }
  }, [playerList, playerRanking, inactive]);

  /** Memoize Sortable Initialization **/
  useEffect(() => {
    const newCanRank = (() => {
      if (!user?.info || !currEvent) return false; // Default to true if data is missing
      if (playerRanking?.rankLock) {
        if (user.info.role === UserRole.admin || user.info.role === UserRole.director) return true;

        const { role, passcode } = user.info;
        const isCaptainRole = role === UserRole.captain || role === UserRole.co_captain;

        if (isCaptainRole) {
          const isIsoTime = isISODateString(currEvent.rosterLock);
          if (isIsoTime) {
            const timePassed = new Date() > new Date(currEvent.rosterLock);
            if (timePassed && !passcode) return false;
          }
          // playerRanking
        }
      }

      // Return true unless user is captain/co-captain, event has ended, and they lack a passcode
      return true;
    })();

    if (!listRef.current || !rankControls || !newCanRank) return;
    setCanRank(newCanRank);
    const sortableList = Sortable.create(listRef.current, {
      animation: 150,
      easing: 'cubic-bezier(1, 0, 0, 1)',
      onEnd: handleSortEnd,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      setData: (dataTransfer) => {
        dataTransfer.setData('text', '');
      },
    });

    return () => sortableList.destroy();
  }, [handleSortEnd, rankControls, screenWidth, user, currEvent]);

  /** Derived State: Sorted Players */
  const sortedPlayerList: IPlayerRank[] = useMemo(() => {
    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPlayers = players.slice(start, start + ITEMS_PER_PAGE);

    // inactive players won't have rankings
    if (inactive) return paginatedPlayers;

    // If ranking is allowed then sort them or keep it as it is
    return showRank && rankControls ? [...paginatedPlayers].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)) : paginatedPlayers;
  }, [players, showRank, rankControls, playerRanking, currentPage]);

  /** Render List **/
  return (
    <>
      <ul ref={listRef} className="sortable-list" onContextMenu={handleContextMenu}>
        {sortedPlayerList.map((player) => (
          <motion.li
            key={player._id}
            className="sortable-item mb-2 flex items-center bg-gray-800 rounded-lg p-2"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Drag Handle */}
            {canRank && (
              <div className="drag-handle cursor-grab flex items-center justify-center">
                <Image height={20} width={20} src="/icons/sort.svg" alt="sort-icon" className="svg-white w-8" />
              </div>
            )}

            {/* Player Card */}
            <PlayerCard
              eventId={eventId}
              isChecked={checkedPlayers.get(player._id) ?? false}
              handleSelectPlayer={handleSelectPlayer}
              player={player}
              setIsLoading={setIsLoading}
              showRank={showRank}
              teamList={teamList}
              divisionList={divisionList}
              refetchFunc={refetchFunc}
              rankControls={rankControls}
              teamId={teamId}
              rank={player.rank}
            />
          </motion.li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex items-center space-x-2 mt-4">
          <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 rounded-md text-white bg-blue-500 disabled:bg-gray-300">
            Prev
          </button>
          <span className="font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md text-white bg-blue-500 disabled:bg-gray-300">
            Next
          </button>
        </div>
      )}
    </>
  );
}

export default PlayerList;
