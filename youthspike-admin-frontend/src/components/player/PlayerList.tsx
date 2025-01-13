import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { motion } from "framer-motion";

import "./PlayerList.css";
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';

import {
  IPlayerExpRel,
  IPlayerRankingExpRel,
  IEvent,
  IOption,
  ITeam,
  IError,
  IPlayerRankingItemExpRel,
  IPlayerRank,
} from '@/types';
import Image from 'next/image';
import { itemVariants } from '@/utils/animation';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYER_RANKING } from '@/graphql/player-ranking';
import { handleError } from '@/utils/handleError';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { getRankedPlayers } from '@/utils/helper';
import { useError } from '@/lib/ErrorContext';

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

function PlayerList({
  playerList,
  eventId,
  setIsLoading,
  rankControls,
  refetchFunc,
  teamList,
  showRank,
  divisionList,
  teamId,
  playerRanking,
  currEvent,
  inactive,
}: IPlayerListProps) {
  
  const listRef = useRef<HTMLUListElement>(null);
  const isMounted = useRef<boolean>(false);
  const screenWidth = useScreenWidth();
  const user = useUser();
  const { setActErr } = useError();

  const [mutatePlayerRanking] = useMutation(UPDATE_PLAYER_RANKING);

  /** State **/
  const [checkedPlayers, setCheckedPlayers] = useState<Map<string, boolean>>(new Map());
  const [canRank, setCanRank] = useState<boolean>(false);
  const [players, setPlayers] = useState<IPlayerExpRel[]>([]);


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
  }


  const handleUpdate = async (upr: IUpdateRank[]) => {
    // upr = update player ranking
    // if (!rankControls) return;
    if (upr.length > 0) {
      try {
        await mutatePlayerRanking({ variables: { teamId, input: upr } });
        // Update rank players with match id and team id
        if (refetchFunc) await refetchFunc();
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

      const sortedPlayers = [...players];
      const [movedItem] = sortedPlayers.splice(oldIndex, 1);
      sortedPlayers.splice(newIndex, 0, movedItem);



      const updatedRanking: IUpdateRank[] = sortedPlayers.map((player, index) => ({
        player: player._id,
        rank: index + 1,
      }));

      setPlayers(sortedPlayers);

      await handleUpdate(updatedRanking);
    }
  };

  useEffect(() => {    
    if (!isMounted.current && playerList && playerList.length > 0) {
      setPlayers(playerList);
      isMounted.current = true;
    }
  }, [playerList]);


  /** Memoize Sortable Initialization **/
  useEffect(() => {
    const newCanRank = (() => {
      if (!user?.info || !currEvent) return true; // Default to true if data is missing

      const { role, passcode } = user.info;
      const isCaptainRole = role === UserRole.captain || role === UserRole.co_captain;
      const eventEnded = new Date() > new Date(currEvent.endDate);

      // Return true unless user is captain/co-captain, event has ended, and they lack a passcode
      return !(isCaptainRole && eventEnded && !passcode);
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

    if (!rankControls || !showRank) return [...players];
    if (!playerRanking?.rankings?.length) return [];

    const npl = getRankedPlayers(players, playerRanking?.rankings); // npl = New Player List

    return showRank && rankControls ? [...npl].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)) : players
  }, [players, showRank, rankControls, playerRanking]);




  /** Render List **/
  return (
    <ul ref={listRef} className="sortable-list">
      {sortedPlayerList.map((player) => (
        <motion.li
          key={player._id}
          className="sortable-item mb-2 flex items-center bg-gray-700 rounded-lg"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {/* Drag Handle */}
          {canRank && (
            <div className="drag-handle cursor-grab flex items-center justify-center">
              <Image
                height={20}
                width={20}
                src="/icons/sort.svg"
                alt="sort-icon"
                className="svg-white w-8"
              />
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
  );
}

export default PlayerList;