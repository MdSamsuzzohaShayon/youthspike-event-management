import { IError, IOption, IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IPlayerRankingItem, IPlayerRankingItemExpRel, ITeam } from '@/types';
import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';
import { UPDATE_PLAYER_RANKING } from '@/graphql/player-ranking';

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
}

interface IPlayerRank {
  player: string;
  rank: number;
}

function PlayerList({ playerList, eventId, setIsLoading, rankControls, refetchFunc, teamList, showRank, divisionList, teamId, setActErr, playerRanking }: IPlayerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const screenWidth = useScreenWidth();

  // const [rankPlayers] = useMutation(UPDATE_PLAYERS);
  const [mutatePlayerRanking] = useMutation(UPDATE_PLAYER_RANKING);


  const sortPlayerRanking=(pl: IPlayerExpRel[], rankings?: IPlayerRankingItemExpRel[] )=>{
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

    return {sortedRankings, sortedPlayers}
  }

  // ====== Handle Events =====
  const handleUpdate = async (upr: IPlayerRank[]) => {
    // upr = update player ranking
    // if (!rankControls) return;
    if (upr.length > 0) {
      try {
        setIsLoading(true);
        // await rankPlayers({ variables: { input: upr } });
        await mutatePlayerRanking({ variables: { teamId, input: upr } });
        // Update rank players with match id and team id
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
    const { oldIndex, newIndex } = evt;

    if (oldIndex !== undefined && newIndex !== undefined) {
      console.log(`Moved from ${oldIndex} to ${newIndex}`);
      const {sortedPlayers, sortedRankings} = sortPlayerRanking( playerList, playerRanking?.rankings);
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
  }, [playerList, screenWidth, rankControls]); // Re-run effect when playerList or screenWidth changes

  /*
useEffect(() => {
  let sortableList: Sortable | null = null;
  if (listRef.current && rankControls) {
    const options: Sortable.Options = {
      animation: 150,
      easing: 'cubic-bezier(1, 0, 0, 1)',
      onEnd: handleSortEnd,
    };

    if (screenWidth <= 768) {
      options.delay = 200;
      options.touchStartThreshold = 100;
      options.onStart = (evt: Sortable.SortableEvent) => evt.preventDefault();
    }

    console.log('Creating Sortable with options:', options);
    sortableList = Sortable.create(listRef.current, options);
  }

  return () => {
    if (sortableList) {
      sortableList.destroy();
    }
  };
}, [playerList, screenWidth, rankControls]);
*/



  const renderPlayerList = (pl: IPlayerExpRel[], prp?: IPlayerRankingExpRel | null) => {
    const playerListEl: React.ReactNode[] = [];

    let rankings: IPlayerRankingItemExpRel[] = [];
    if (prp) rankings = prp.rankings;

    // const sortedPlayers = [...pl].sort((a, b)=> {
    //   const findPR = sortedRankings.find((r)=> r.player._id === pl[i]._id);
    // });

    const {sortedPlayers, sortedRankings} = sortPlayerRanking(pl, rankings);

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
    <ul ref={listRef} className="w-full">
      {renderPlayerList(playerList, playerRanking)}
    </ul>
  );
}

export default PlayerList;
