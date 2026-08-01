"use client";

import React, { useMemo, useState } from "react";
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
import useStatsFilterData from "@/hooks/player-stats/useStatsFilterData";
import BadgeIcon from "../badge/BadgeIcon";

interface IPlayerStatsContainerProps {
  queryRef: QueryRef<{
    getPlayerWithStats: { data: IGetPlayerStats };
  }>;
}

function PlayerStatsContainer({ queryRef }: IPlayerStatsContainerProps) {
  const { data, error } = useReadQuery(queryRef);
  if (error) console.error(error);

  if (!data?.getPlayerWithStats?.data) return <div>No data found</div>;

  const socket = useSocket();
  const dispatch = useAppDispatch();
  const apolloClient = useApolloClient();


  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const {
    events,
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
    badge
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




  const {
    matchOptions,
    vsClubOptions,
    teammateOptions,
    vsPlayerOptions,
    gameOptions,
    eventOptions
  } = useStatsFilterData({
    player,
    players: safePlayers,
    filter,
    matches,
    rounds: safeRounds,
    nets,
    teams: [team, ...safeOponents],
    events
  });

  const { netMap, allNetIds } = useMemo(() => {
    const map = new Map<string, INetRelatives>();
    const netIds = new Set<string>();
    for (let i = 0; i < safeNets.length; i++) {
      const n = safeNets[i];
      map.set(n._id, n);
      netIds.add(n._id);
    }
    return { netMap: new Map(nets.map((n) => [n._id, n])), allNetIds: netIds };
  }, [safeNets]);

  const safePlayerstats = useMemo(() => {
    if (!playerstats || !Array.isArray(playerstats)) return [];

    return filterPlayerStats(
      events,
      playerstats,
      filter,
      player._id,
      safeMatches,
      netMap,
      allNetIds,
      team
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
                filter={filter}
                handleInputChange={<K extends keyof IFilter>(
                  key: K,
                  value: IFilter[K]
                ) => handleInputChange(key as keyof IFilter, value as string)}
                gameOptions={gameOptions}
                matchOptions={matchOptions}
                teammateOptions={teammateOptions}
                vsClubOptions={vsClubOptions}
                vsPlayerOptions={vsPlayerOptions}
                eventOptions={eventOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* <!-- Player Profile Header --> */}
      <div className="relative mb-12 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 md:p-10">
        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl" />

        <div className="relative flex flex-col-reverse items-center gap-8 md:flex-row md:items-center md:justify-between">
          {/* Identity block */}
          <div className="w-full text-center md:text-left">
            <h1 className="bg-gradient-to-r from-white via-white to-yellow-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl">
              {player.firstName} {player.lastName}
            </h1>

            <p className="mt-2 flex items-center justify-center gap-2 text-sm font-medium tracking-wide text-yellow-logo md:justify-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
              {player.status} &nbsp;•&nbsp; {player.division}
            </p>

            <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3 md:justify-start">
              {/* Team Card */}
              {team?._id && (
                <Link
                  href={`/teams/${team._id}/roster`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-800/60 px-4 py-2 backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/60 hover:bg-gray-800"
                >
                  {team?.logo && (
                    <CldImage
                      height={100}
                      width={100}
                      src={team.logo}
                      alt={team.name}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-gray-700 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="flex flex-col justify-center text-left">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Team
                    </p>
                    <p className="font-medium text-white underline decoration-yellow-400 decoration-2 underline-offset-2">
                      {team?.name || ""}
                    </p>
                  </div>
                </Link>
              )}

              {/* Username Card */}
              {player.username && (
                <div className="flex flex-col justify-center rounded-xl border border-gray-700/60 bg-gray-800/60 px-4 py-2 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">
                    Username
                  </p>
                  <p className="font-medium text-white">{player.username}</p>
                </div>
              )}
            </div>
          </div>

          {/* Avatar block */}
          <div className="relative shrink-0">
            {/* Gradient glow ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-yellow-400 via-yellow-200 to-white opacity-70 blur-md transition-opacity duration-500 animate-pulse" />

            <div className="relative">
              {player.profile ? (
                <CldImage
                  alt={`${player.firstName} ${player.lastName}`}
                  src={player.profile}
                  height={140}
                  width={140}
                  crop="fit"
                  className="h-32 w-32 rounded-2xl border-2 border-gray-900 object-cover shadow-xl md:h-36 md:w-36"
                />
              ) : (
                <TextImg
                  className="h-32 w-32 rounded-2xl border-2 border-gray-900 shadow-xl md:h-36 md:w-36"
                  fullText={`${player.firstName}${player.lastName}`}
                />
              )}

              {/* Badge */}
              {badge && (
                <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 px-3 py-1 text-xs font-bold uppercase text-black shadow-md ring-1 ring-black/10 transition-transform duration-300 hover:scale-105">
                  <BadgeIcon badge={badge} className='h-4 w-4' />
                  <span className="whitespace-nowrap">{badge.name}</span>
                </div>
              )}
            </div>
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
            filter={filter}
            handleInputChange={<K extends keyof IFilter>(
              key: K,
              value: IFilter[K]
            ) => handleInputChange(key as keyof IFilter, value as string)}
            gameOptions={gameOptions}
            matchOptions={matchOptions}
            teammateOptions={teammateOptions}
            vsClubOptions={vsClubOptions}
            vsPlayerOptions={vsPlayerOptions}
            eventOptions={eventOptions}
          />
        </div>

        {/* Main Content */}
        <div className="w-full md:w-9/12">
          <div className="flex flex-col justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Performance Overview</h2>
            {/* <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
            Pro Score: {proScore}
          </div> */}
            <ActiveFilters
              filter={filter}
              onClearAll={clearAllFilters}
              gameOptions={gameOptions}
              matchOptions={matchOptions}
              teammateOptions={teammateOptions}
              vsClubOptions={vsClubOptions}
              vsPlayerOptions={vsPlayerOptions}
              eventOptions={eventOptions}
            />
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

export default PlayerStatsContainer;
