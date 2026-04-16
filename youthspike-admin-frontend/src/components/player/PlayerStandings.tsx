import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  EPlayerStatType,
  IMatch,
  IMatchExpRel,
  IPlayer,
  IPlayerRanking,
  IPlayerRecord,
  IPlayerStats,
  ITeam,
} from "@/types";
import PlayerRow from "./PlayerRow";
import Pagination from "../elements/Pagination";
import SortableHeader from "../elements/SortableHeader";
import { aggregatePlayerStats } from "@/utils/helper";
import { calculatePlayerRecords } from "@/utils/calcScore";

interface IPlayerStandingsProps {
  playerList: IPlayer[];
  matchList: IMatch[];
  playerStatsMap: Map<string, IPlayerStats[]>;
  teamRank?: boolean;
  teamMap?: Map<string, ITeam>;
}

const ITEMS_PER_PAGE = 30;


function PlayerStandings({
  playerList,
  matchList,
  teamRank,
  playerStatsMap,
  teamMap
}: IPlayerStandingsProps) {

  // Local state
  const [showRank, setShowRank] = useState<boolean>(teamRank || false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: EPlayerStatType; direction: 'asc' | 'desc' }>({
    key: showRank ? EPlayerStatType.Player : EPlayerStatType.WinPercentage,
    direction: 'desc'
  });


  // Memoize player records calculation with null filtering
  const allPlayerRecords = useMemo(() => {
    if (!playerList.length) return [];
    
    const newMatchList: IMatchExpRel[] = matchList?.length > 0 ? matchList : [];
    
    const records = calculatePlayerRecords(playerList, newMatchList, teamMap);
    
    // Filter out null or invalid player records
    return records.filter(record => 
      record && 
      record._id && 
      record.firstName !== undefined
    );
  }, [playerList, matchList, teamMap]);

  // Memoize sorted players with additional safety checks
  const sortedPlayers = useMemo(() => {
    if (!allPlayerRecords.length) return [];

    let sorted = [...allPlayerRecords];

    if (showRank) {
      return sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    // Custom sorting based on sortConfig
    sorted.sort((a, b) => {
      // Safety check for null players
      if (!a || !b) return 0;

      const aStats = playerStatsMap.get(a._id) || [];
      const bStats = playerStatsMap.get(b._id) || [];
      
      const aAggregated = aggregatePlayerStats(aStats);
      const bAggregated = aggregatePlayerStats(bStats);

      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case EPlayerStatType.Player:
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase().trim();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase().trim();
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
          aValue = (aAggregated.break || 0) + (aAggregated.broken || 0);
          bValue = (bAggregated.break || 0) + (bAggregated.broken || 0);
          break;
        
        case EPlayerStatType.AcePercentage:
          aValue = aAggregated.serveAce > 0 
            ? ((aAggregated.serveAce || 0) / aAggregated.serveOpportunity) * 100 
            : 0;
          bValue = bAggregated.serveAce > 0 
            ? ((bAggregated.serveAce || 0) / bAggregated.serveOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.ReceivePercentage:
          aValue = aAggregated.receiverOpportunity > 0 
            ? ((aAggregated.receivedCount || 0) / aAggregated.receiverOpportunity) * 100 
            : 0;
          bValue = bAggregated.receiverOpportunity > 0 
            ? ((bAggregated.receivedCount || 0) / bAggregated.receiverOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.HittingPercentage:
          aValue = aAggregated.hittingOpportunity > 0 
            ? ((aAggregated.cleanHits || 0) / aAggregated.hittingOpportunity) * 100 
            : 0;
          bValue = bAggregated.hittingOpportunity > 0 
            ? ((bAggregated.cleanHits || 0) / bAggregated.hittingOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.SetAssistsPercentage:
          aValue = aAggregated.settingOpportunity > 0 
            ? ((aAggregated.cleanSets || 0) / aAggregated.settingOpportunity) * 100 
            : 0;
          bValue = bAggregated.settingOpportunity > 0 
            ? ((bAggregated.cleanSets || 0) / bAggregated.settingOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.DefensePercentage:
          aValue = aAggregated.defensiveOpportunity > 0 
            ? ((aAggregated.defensiveConversion || 0) / aAggregated.defensiveOpportunity) * 100 
            : 0;
          bValue = bAggregated.defensiveOpportunity > 0 
            ? ((bAggregated.defensiveConversion || 0) / bAggregated.defensiveOpportunity) * 100 
            : 0;
          break;
        
        case EPlayerStatType.WinPercentage:
          const aGamesPlayed = (a.numOfGame || 0) - (a.running || 0);
          const bGamesPlayed = (b.numOfGame || 0) - (b.running || 0);
          aValue = aGamesPlayed > 0 ? ((a.wins || 0) / aGamesPlayed) * 100 : 0;
          bValue = bGamesPlayed > 0 ? ((b.wins || 0) / bGamesPlayed) * 100 : 0;
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
  }, [allPlayerRecords, showRank, sortConfig, playerStatsMap]);

  // Memoize paginated players with safety check
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPlayers.slice(start, start + ITEMS_PER_PAGE).filter(player => 
      player && player._id
    );
  }, [sortedPlayers, currentPage]);

  const handleSort = useCallback((key: EPlayerStatType) => {
    setShowRank(false);
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  }, []);

  return (
    <div className="playerList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px] w-full">
          <div className="relative w-full">
            <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
              <thead>
                <tr className="bg-yellow-logo text-black font-semibold rounded-lg">
                  <th className="py-3 px-3 sticky left-0 top-0 shadow-md z-20 bg-yellow-logo min-w-[120px] max-w-[120px]">
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
                    key={player?._id}
                    index={index}
                    player={player}
                    teamRank={showRank}
                    playerStats={playerStatsMap.get(player?._id) || []}
                    team={(player.teams && player.teams?.length > 0 && teamMap?.has(String(player.teams[0]))) ? teamMap?.get(String(player.teams[0])) : null}
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