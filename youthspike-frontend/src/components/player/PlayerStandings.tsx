import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  EPlayerStatType,
  IMatch,
  IMatchExpRel,
  IPlayer,
  IPlayerRecord,
  IPlayerStats,
} from "@/types";
import { calculatePlayerRecords } from "@/utils/scoreCalc";
import { useAppSelector } from "@/redux/hooks";
import PlayerRow from "./PlayerRow";
import Pagination from "../elements/Pagination";
import SortableHeader from "../elements/SortableHeader";
import { aggregatePlayerStats } from "@/utils/helper";

interface IPlayerStandingsProps {
  teamRank?: boolean;
  playerList: IPlayer[];
  matchList: IMatch[];
  playerStatsMap: Map<string, IPlayerStats[]>;
}

const ITEMS_PER_PAGE = 30;


function PlayerStandings({
  playerList,
  matchList,
  teamRank,
  playerStatsMap,
}: IPlayerStandingsProps) {
  // Local state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: EPlayerStatType; direction: 'asc' | 'desc' }>({
    key: teamRank ? EPlayerStatType.Player : EPlayerStatType.WinPercentage,
    direction: 'desc'
  });

  // Redux state
  const { rankingMap } = useAppSelector((state) => state.playerRanking);

  // Memoize player records calculation
  const allPlayerRecords = useMemo(() => {
    if (!playerList.length) return [];
    
    const newMatchList: IMatchExpRel[] = matchList.length > 0 ? matchList : [];
    const newRankingMap = new Map<string, number>(rankingMap);
    
    return calculatePlayerRecords(playerList, newMatchList, newRankingMap);
  }, [playerList, matchList, rankingMap]);

  // Memoize sorted players
  const sortedPlayers = useMemo(() => {
    if (!allPlayerRecords.length) return [];

    let sorted = [...allPlayerRecords];

    if (teamRank) {
      return sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    // Custom sorting based on sortConfig
    sorted.sort((a, b) => {
      const aStats = playerStatsMap.get(a._id) || [];
      const bStats = playerStatsMap.get(b._id) || [];
      
      const aAggregated = aggregatePlayerStats(aStats);
      const bAggregated = aggregatePlayerStats(bStats);

      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case EPlayerStatType.Player:
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        
        case EPlayerStatType.ServePercentage:
          aValue = aAggregated.serveOpportunity > 0 
            ? (aAggregated.serveCompletionCount / aAggregated.serveOpportunity) * 100 
            : 0;
          bValue = bAggregated.serveOpportunity > 0 
            ? (bAggregated.serveCompletionCount / bAggregated.serveOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.PlusMinus:
          aValue = aAggregated.break + aAggregated.broken;
          bValue = bAggregated.break + bAggregated.broken;
          break;
        
        case EPlayerStatType.AcePercentage:
          aValue = aAggregated.serveAce > 0 
            ? (aAggregated.servingAceNoTouch / aAggregated.serveAce) * 100 
            : 0;
          bValue = bAggregated.serveAce > 0 
            ? (bAggregated.servingAceNoTouch / bAggregated.serveAce) * 100 
            : 0;
          break;
        
        case EPlayerStatType.ReceivePercentage:
          aValue = aAggregated.receiverOpportunity > 0 
            ? (aAggregated.receivedCount / aAggregated.receiverOpportunity) * 100 
            : 0;
          bValue = bAggregated.receiverOpportunity > 0 
            ? (bAggregated.receivedCount / bAggregated.receiverOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.HittingPercentage:
          aValue = aAggregated.hittingOpportunity > 0 
            ? (aAggregated.cleanHits / aAggregated.hittingOpportunity) * 100 
            : 0;
          bValue = bAggregated.hittingOpportunity > 0 
            ? (bAggregated.cleanHits / bAggregated.hittingOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.ReceivePercentage:
          aValue = aAggregated.settingOpportunity > 0 
            ? (aAggregated.cleanSets / aAggregated.settingOpportunity) * 100 
            : 0;
          bValue = bAggregated.settingOpportunity > 0 
            ? (bAggregated.cleanSets / bAggregated.settingOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.DefensePercentage:
          aValue = aAggregated.defensiveOpportunity > 0 
            ? (aAggregated.defensiveConversion / aAggregated.defensiveOpportunity) * 100 
            : 0;
          bValue = bAggregated.defensiveOpportunity > 0 
            ? (bAggregated.defensiveConversion / bAggregated.defensiveOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.WinPercentage:
          const aGamesPlayed = a.numOfGame - a.running;
          const bGamesPlayed = b.numOfGame - b.running;
          aValue = aGamesPlayed > 0 ? (a.wins / aGamesPlayed) * 100 : 0;
          bValue = bGamesPlayed > 0 ? (b.wins / bGamesPlayed) * 100 : 0;
          break;
        
        default:
          return 0;
      }

      // Handle string comparison for player names
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      return sortConfig.direction === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [allPlayerRecords, teamRank, sortConfig, playerStatsMap]);

  // Memoize paginated players
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPlayers, currentPage]);

  const handleSort = useCallback((key: EPlayerStatType) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  return (
    <div className="playerList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px] w-full">
          <div className="relative w-full">
            <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
              <thead>
                <tr className="bg-yellow-500 text-black font-semibold">
                  <th className="py-3 px-3 sticky left-0 top-0 shadow-md z-20 bg-yellow-500 min-w-[120px] max-w-[120px]">
                    Player
                  </th>
                  
                  <SortableHeader
                    label="Serve %"
                    sortKey={EPlayerStatType.ServePercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="+/-"
                    sortKey={EPlayerStatType.PlusMinus}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="Ace %"
                    sortKey={EPlayerStatType.AcePercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="Receive %"
                    sortKey={EPlayerStatType.ReceivePercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="Hitting %"
                    sortKey={EPlayerStatType.HittingPercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="Set Assists %"
                    sortKey={EPlayerStatType.SetAssistsPercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  
                  <SortableHeader
                    label="Defense %"
                    sortKey={EPlayerStatType.DefensePercentage}
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player, index) => (
                  <PlayerRow
                    key={player._id}
                    index={index}
                    player={player}
                    teamRank={teamRank}
                    playerStats={playerStatsMap.get(player._id) || []}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="w-full mt-6">
        <Pagination
          currentPage={currentPage}
          itemList={sortedPlayers}
          setCurrentPage={setCurrentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}


export default PlayerStandings;