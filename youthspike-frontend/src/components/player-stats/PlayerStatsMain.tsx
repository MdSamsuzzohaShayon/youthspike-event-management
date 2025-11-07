"use client";

import React, { useMemo, useRef, useState } from "react";
import { QueryRef, useApolloClient, useReadQuery } from "@apollo/client/react";
import StatBox from "./StatBox";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import { IFilter, IGetPlayerStats, INetRelatives, IProStats } from "@/types";
import StatAddBox from "./StatAddBox";
import usePlayerSocket from "@/hooks/player/usePlayerScoket";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch } from "@/redux/hooks";
import { aggregatePlayerStats } from "@/utils/helper";
import StatsFilter from "./StatsFilter";
import { useFilterState } from "@/hooks/player-stats/useFilterState";
import { filterPlayerStats } from "@/utils/player-stats/playerStatsFilter";
import Link from "next/link";
import Image from "next/image";
import ActiveFilters from "./ActiveFilters";

interface IPlayerStatsMainProps {
  queryRef: QueryRef<{
    getPlayerWithStats: { data: IGetPlayerStats };
  }>;
}

function PlayerStatsMain({ queryRef }: IPlayerStatsMainProps) {
  const { data, error } = useReadQuery(queryRef);
  if (error) console.error(error);
  if (!data?.getPlayerWithStats?.data) return <div>No data found</div>;

  const socket = useSocket();
  const dispatch = useAppDispatch();
  const apolloClient = useApolloClient();

  const filterEl = useRef<HTMLDivElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    player,
    players,
    team,
    oponents,
    playerstats,
    matches,
    rounds,
    nets,
    multiplayer,
    weight,
    stats,
    groups,
  } = data.getPlayerWithStats.data;

  const { filter, handleInputChange, clearAllFilters } = useFilterState();

  usePlayerSocket({
    socket,
    dispatch,
    playerId: player._id,
    apolloClient,
  });

  // Event handlers
  const handleFilterOpen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsFilterOpen(true);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  const handleFilterClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsFilterOpen(false);
    document.body.style.overflow = "unset"; // Re-enable scrolling
  };

  // Close filter when clicking on overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleFilterClose(e);
    }
  };

  const safeNets = nets || [];
  const safeRounds = rounds || [];
  const safeMatches = matches || [];
  const safeOponents = oponents || [];
  const safePlayers = players || [];

  const {netMap, allNetIds} = useMemo(() => {
    const map = new Map<string, INetRelatives>();
    const netIds = new Set<string>();
    for (let i = 0; i < safeNets.length; i++) {
      const n = safeNets[i];
      map.set(n._id, n);
      netIds.add(n._id);
    }
    return {netMap: new Map(nets.map((n) => [n._id, n])), allNetIds: netIds};
  }, [safeNets]);


  const playerMap = useMemo(()=>{
    return new Map(safePlayers.map((p)=> [p._id, p]));
  }, [safePlayers]);

  
  const clubMap = useMemo(()=>{
    return new Map(safeOponents.map((p)=> [p._id, p]));
  }, [safeOponents]);
  

  const safePlayerstats = useMemo(() => {
    if (!playerstats || !Array.isArray(playerstats)) return [];

    return filterPlayerStats(
      playerstats,
      filter,
      player._id,
      safeMatches,
      netMap,
      allNetIds,
      groups
    );
  }, [playerstats, filter, player._id, safeMatches, safeNets, netMap]);

  let totalServe = 0;
  for (const ps of safePlayerstats) {
    totalServe += ps.serveOpportunity;
  }

  const aggregatedStats = aggregatePlayerStats(safePlayerstats);

  return (
    <div className="container mx-auto px-2">
      {/* Mobile Filter Overlay and Sidebar */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={handleOverlayClick}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/50 transition-opacity duration-300" />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full overflow-y-auto p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 p-4 border-b border-gray-700">
                <h2 className="text-yellow-logo text-lg uppercase font-bold mb-4 flex items-center gap-2">
                  <Image
                    src="/icons/filter.svg"
                    width={20}
                    height={20}
                    className="w-8"
                    alt="filter-icon svg-yellow"
                  />
                  Filter Stats
                </h2>
                <button
                  onClick={handleFilterClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Image
                    src="/icons/close.svg"
                    width={20}
                    height={20}
                    className="w-6 h-6 svg-white"
                    alt="close-icon"
                  />
                </button>
              </div>

              {/* Filter Content */}
              <StatsFilter
                teams={[team, ...safeOponents]}
                filter={filter}
                handleInputChange={<K extends keyof IFilter>(
                  key: K,
                  value: IFilter[K]
                ) => handleInputChange(key as keyof IFilter, value as any)}
                matches={safeMatches}
                nets={safeNets}
                rounds={safeRounds}
                players={safePlayers}
                player={player}
              />
            </div>
          </div>
        </div>
      )}

      {/* <!-- Player Profile Header --> */}
      <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 mb-12">
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-yellow-logo font-medium mt-2">
            {player.status} | {player.division}
          </p>
          <div className="flex justify-start gap-x-2 items-stretch mt-2">
            {/* Team Box */}
            <Link
              href={`/teams/${team._id}`}
              className="bg-gray-800 px-4 py-2 rounded-lg underline decoration-yellow-400 flex gap-x-2 items-center"
            >
              {team?.logo && (
                <CldImage
                  height={100}
                  width={100}
                  src={team.logo}
                  alt={team.name}
                  className="w-12 h-12 object-cover"
                />
              )}
              <div className="flex flex-col justify-center">
                <p className="text-xs text-gray-400 uppercase">Team</p>
                <p className="font-medium">{team?.name || ""}</p>
              </div>
            </Link>

            {/* Username Box */}
            {player.username && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg flex flex-col justify-center">
                <p className="text-xs text-gray-400 uppercase">Username</p>
                <p className="font-medium">{player.username}</p>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          {player.profile ? (
            <CldImage
              alt=""
              src={player.profile}
              height={100}
              width={100}
              crop="fit"
              className="w-32 rounded-lg"
            />
          ) : (
            <TextImg
              className="w-32 h-32 rounded-lg"
              fullText={`${player.firstName}${player.lastName}`}
            />
          )}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 text-xs font-bold rounded-full shadow-md uppercase">
            {player.division}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-x-4">
        {/* Filter Button - Mobile Only */}
        <button
          className="flex md:hidden items-center justify-between btn-info mb-4"
          onClick={handleFilterOpen}
        >
          <span>
            <Image
              src="/icons/filter.svg"
              width={20}
              height={20}
              className="w-8 svg-black"
              alt="filter-icon"
            />
          </span>
          Filter Stats
        </button>

        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block md:w-3/12 bg-gray-900 rounded-xl p-4">
          <button className="flex items-center justify-between mb-4 border-b border-gray-500 w-full">
            <span>
              <Image
                src="/icons/filter.svg"
                width={20}
                height={20}
                className="w-8 svg-white"
                alt="filter-icon"
              />
            </span>
            Filter Stats
          </button>
          <StatsFilter
            teams={[team, ...safeOponents]}
            filter={filter}
            handleInputChange={<K extends keyof IFilter>(
              key: K,
              value: IFilter[K]
            ) => handleInputChange(key as keyof IFilter, value as any)}
            matches={safeMatches}
            nets={safeNets}
            rounds={safeRounds}
            players={safePlayers}
            player={player}
          />
        </div>

        {/* Main Content */}
        <div className="w-full md:w-9/12">
          <div className="flex flex-col justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Performance Overview</h2>
            {/* <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
            Pro Score: {proScore}
          </div> */}
            <ActiveFilters filter={filter} netMap={netMap}  onClearAll={clearAllFilters} playerMap={playerMap} clubMap={clubMap} />
          </div>

          {/* <!-- Stats Grid --> */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* <!-- Serving Stats --> */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-400 w-2 h-6 rounded-full"></div>
                <h3 className="font-bold uppercase text-yellow-logo">
                  Serving
                </h3>
              </div>
              <div className="space-y-4">
                <StatBox
                  label="Serve COMPLETION %"
                  value={aggregatedStats.serveCompletionCount}
                  total={aggregatedStats.serveOpportunity}
                />
                <StatBox
                  label="ACE % (NO 2ND TOUCH)"
                  value={aggregatedStats.serveAce}
                  total={aggregatedStats.serveOpportunity}
                />
                {/* <StatBox
                label="Ace No Touch %"
                value={aggregatedStats.servingAceNoTouch}
                total={aggregatedStats.serveOpportunity}
              /> */}
              </div>
            </div>

            {/* <!-- Receiving Stats --> */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-400 w-2 h-6 rounded-full"></div>
                <h3 className="font-bold uppercase text-yellow-logo">
                  Receiving
                </h3>
              </div>
              <div className="space-y-4">
                <StatBox
                  label="Receiving %"
                  value={aggregatedStats.receivedCount}
                  total={aggregatedStats.receiverOpportunity}
                />
                <StatBox
                  label="Set Assist %"
                  value={aggregatedStats.cleanSets}
                  total={aggregatedStats.settingOpportunity}
                />
                <StatAddBox
                  label="Break +/-"
                  plus={aggregatedStats.break}
                  minus={aggregatedStats.broken}
                />
              </div>
            </div>

            {/* <!-- Hitting & Defense --> */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-400 w-2 h-6 rounded-full"></div>
                <h3 className="font-bold uppercase text-yellow-logo">
                  Attack & Defense
                </h3>
              </div>
              <div className="space-y-4">
                <StatBox
                  label="Hitting %"
                  value={aggregatedStats.cleanHits}
                  total={aggregatedStats.hittingOpportunity}
                />
                <StatBox
                  label="Defensive %"
                  value={aggregatedStats.defensiveConversion}
                  total={aggregatedStats.defensiveOpportunity}
                />
              </div>
            </div>
          </div>

          {/* Winning percentage  */}
          {/* <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Winning Percentage</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-yellow-400 w-2 h-6 rounded-full"></div>
              <h3 className="font-bold uppercase text-yellow-logo">Stats</h3>
            </div>
            <div className="space-y-4">
              <StatBox
                label="win %  (overall filter)  point"
                value={noOfGamesWon}
                total={noOfGamesPlayed}
              />
            </div>
          </div>
        </div>
      </div> */}
        </div>
      </div>
    </div>
  );
}

export default PlayerStatsMain;
