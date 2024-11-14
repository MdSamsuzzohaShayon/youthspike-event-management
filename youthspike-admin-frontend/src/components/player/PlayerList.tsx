import { IError, IEvent, IOption, IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IPlayerRankingItem, IPlayerRankingItemExpRel, ITeam } from '@/types';
import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';
import { UPDATE_PLAYER_RANKING } from '@/graphql/player-ranking';
import { handleError } from '@/utils/handleError';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';

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
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
  playerRanking?: IPlayerRankingExpRel | null;
  currEvent?: null | IEvent;
}

interface IPlayerRank {
  player: string;
  rank: number;
}

function PlayerList({ playerList, eventId, setIsLoading, rankControls, refetchFunc, teamList, showRank, divisionList, teamId, setActErr, playerRanking, currEvent }: IPlayerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const screenWidth = useScreenWidth();
  const user = useUser();

  // const [rankPlayers] = useMutation(UPDATE_PLAYERS);
  const [mutatePlayerRanking] = useMutation(UPDATE_PLAYER_RANKING);


  const sortPlayerRanking = (pl: IPlayerExpRel[], rankings?: IPlayerRankingItemExpRel[]) => {
    let sortedRankings: IPlayerRankingItemExpRel[] = [];
    let sortedPlayers = [];
    if (rankings && rankings.length > 0) {
      sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);
      const playerIds = new Set();

      for (let i = 0; i < sortedRankings.length; i += 1) {
        const findPlayer = pl.find((p) => p._id === sortedRankings[i].player._id);
        if (findPlayer) {
          playerIds.add(findPlayer._id);
          sortedPlayers.push(findPlayer);
        }
      }
    } else {
      sortedPlayers = [...pl];
    }

    return { sortedRankings, sortedPlayers }
  }

  // ====== Handle Events =====
  const handleUpdate = async (upr: IPlayerRank[]) => {
    // upr = update player ranking
    // if (!rankControls) return;
    if (upr.length > 0) {
      try {
        setIsLoading(true);
        await mutatePlayerRanking({ variables: { teamId, input: upr } });
        // Update rank players with match id and team id
        if (refetchFunc) await refetchFunc();
      } catch (error: any) {
        // if (setActErr) setActErr({ success: false, message: `Failed to update player: ${error?.message || JSON.stringify(error)}` });
        console.log(error);
        handleError({ error, setActErr });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSortEnd = async (evt: Sortable.SortableEvent) => {
    const { oldIndex, newIndex } = evt;

    if (oldIndex !== undefined && newIndex !== undefined) {
      console.log(`Moved from ${oldIndex} to ${newIndex}`);
      const { sortedPlayers } = sortPlayerRanking(playerList, playerRanking?.rankings);
      const activeList = [...sortedPlayers.filter((p) => p.status === EPlayerStatus.ACTIVE)];

      const [movedItem] = activeList.splice(oldIndex, 1);
      activeList.splice(newIndex, 0, movedItem);

      const updatedRanking: IPlayerRank[] = activeList.map((player, index) => ({
        player: player._id,
        rank: index + 1,
      }));

      console.log('Updated Ranking:', updatedRanking);
      await handleUpdate(updatedRanking);
    }
  };

  useEffect(() => {
    let sortableList: Sortable | null = null;

  // Determine if ranking is allowed based on role, event end date, and passcode
  const canRank = (() => {
    if (!user?.info || !currEvent) return true; // Default to true if data is missing

    const { role, passcode } = user.info;
    const isCaptainRole = role === UserRole.captain || role === UserRole.co_captain;
    const eventEnded = new Date() > new Date(currEvent.endDate);    

    // Return true unless user is captain/co-captain, event has ended, and they lack a passcode
    return !(isCaptainRole && eventEnded && !passcode);
  })();
  


    // Only create Sortable if ranking is allowed, listRef exists, and rankControls is enabled
    if (listRef && rankControls && canRank) {
      // Common configuration options
      const sortableOptions = {
        animation: 150,
        easing: 'cubic-bezier(1, 0, 0, 1)',
        onEnd: handleSortEnd,
      };

      // Add mobile-specific settings for screens <= 768px
      if (screenWidth <= 768) {
        Object.assign(sortableOptions, {
          multiDrag: true,
          selectedClass: 'selected',
          fallbackTolerance: 3,
          delay: 200,
          touchStartThreshold: 100,
          onStart(evt: any) {
            evt.preventDefault(); // Prevent default behavior for long press on iOS
          },
        });
      }

      sortableList = Sortable.create(listRef.current!, sortableOptions);
    }

    return () => {
      if (sortableList) {
        sortableList.destroy();
      }
    };
  }, [playerList, screenWidth, rankControls, user, currEvent]); // Re-run effect when playerList or screenWidth changes




  const renderPlayerList = (pl: IPlayerExpRel[], prp?: IPlayerRankingExpRel | null) => {

    const playerListEl: React.ReactNode[] = [];
    const { sortedPlayers, sortedRankings } = showRank || rankControls
      ? sortPlayerRanking(pl, prp?.rankings)
      : { sortedPlayers: [...pl].sort((a, b) => a.firstName.localeCompare(b.firstName)), sortedRankings: [] };

    for (let i = 0; i < sortedPlayers.length; i += 1) {
      let pr = null;
      if (sortedRankings && sortedRankings.length > 0) {
        const findPR = sortedRankings.find((r) => r.player._id === sortedPlayers[i]._id);
        if (findPR) {
          pr = findPR.rank;
        }
      }
      const playerEl = (<li key={sortedPlayers[i]._id} className="sortable-item mb-2">
        <PlayerCard
          eventId={eventId}
          player={sortedPlayers[i]}
          setIsLoading={setIsLoading}
          showRank={showRank}
          teamList={teamList}
          divisionList={divisionList}
          refetchFunc={refetchFunc}
          rankControls={rankControls}
          teamId={teamId}
          setActErr={setActErr}
          rank={pr}
        />
      </li>);
      playerListEl.push(playerEl);

    }

    return <>{playerListEl}</>;
  }

  return (
    <ul ref={listRef}>
      {renderPlayerList(playerList, playerRanking)}
    </ul>
  );
}

export default PlayerList;
