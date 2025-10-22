"use client";

import React, { useMemo, useState } from "react";
import { QueryRef, useApolloClient, useReadQuery } from "@apollo/client/react";
import StatBox from "./StatBox";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import { IFilter, IGetPlayerStats, IProStats } from "@/types";
import StatAddBox from "./StatAddBox";
import usePlayerSocket from "@/hooks/player/usePlayerScoket";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch } from "@/redux/hooks";
import { aggregatePlayerStats } from "@/utils/helper";
import StatsFilter from "./StatsFilter";
import { useFilterState } from "@/hooks/player-stats/useFilterState";
import { filterPlayerStats } from "@/utils/player-stats/playerStatsFilter";

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
  } = data.getPlayerWithStats.data;

  const { filter, handleInputChange } = useFilterState();

  usePlayerSocket({
    socket,
    dispatch,
    playerId: player._id,
    apolloClient,
  });

  const safeNets = nets || [];
  const safeRounds = rounds || [];
  const safeMatches = matches || [];
  const safeOponents = oponents || [];
  const safePlayers = players || [];

  const safePlayerstats = useMemo(() => {
    if (!playerstats || !Array.isArray(playerstats)) return [];
  
    return filterPlayerStats(playerstats, filter, player._id, safeMatches, safeNets);
  }, [playerstats, filter, player._id, safeMatches, safeNets]);

  const totalGames = safePlayerstats?.length || 0;

  let totalServe = 0;
  for (const ps of safePlayerstats) {
    totalServe += ps.serveOpportunity;
  }

  const aggregatedStats = aggregatePlayerStats(safePlayerstats);

  const proScore: number = useMemo(() => {
    const fields: (keyof IProStats)[] = [
      "acePercentage",
      "defensiveConversionPercentage",
      "hittingPercentage",
      "receivingPercentage",
      "servingPercentage",
      "settingPercentage",
    ];

    const total = fields.reduce((sum, key) => {
      // Type-safe null checks with proper typing
      const m: number =
        multiplayer && typeof multiplayer === "object" && key in multiplayer
          ? (multiplayer[key] as number) ?? 0
          : 0;

      const w: number =
        weight && typeof weight === "object" && key in weight
          ? (weight[key] as number) ?? 0
          : 0;

      return sum + m * w;
    }, 0);

    return total * 10;
  }, [multiplayer, weight]);

  const { noOfGamesPlayed, noOfGamesWon } = useMemo(() => {
    const playerId = player._id;
    let noOfGamesWon = 0;

    // Use safeNets instead of nets
    for (const n of safeNets) {
      if (n.teamAPlayerA === playerId || n.teamAPlayerB === playerId) {
        if (n.teamAScore && n.teamBScore && n.teamAScore > n.teamBScore) {
          noOfGamesWon++;
        }
      } else if (n.teamBPlayerA === playerId || n.teamBPlayerB === playerId) {
        if (n.teamBScore && n.teamAScore && n.teamBScore > n.teamAScore) {
          noOfGamesWon++;
        }
      }
    }
    return { noOfGamesPlayed: safeNets.length, noOfGamesWon };
  }, [player, safeNets]); // Use safeNets in dependency array

  return (
    <div className="container mx-auto px-2">
      {/* <!-- Player Profile Header --> */}
      <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 mb-12">
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-yellow-logo font-medium mt-2">
            {player.status} | {player.division}
          </p>
          <div className="flex justify-between md:justify-start gap-x-2 items-center mt-2">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-400 uppercase">Team</p>
              <p className="font-medium">{team?.name || ""}</p>
            </div>
            {player.username && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
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
              className="w-32 rounded-xl"
            />
          ) : (
            <TextImg
              className="w-32 h-32"
              fullText={`${player.firstName}${player.lastName}`}
            />
          )}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 text-xs font-bold rounded-full shadow-md uppercase">
            {player.division}
          </div>
        </div>
      </div>

      {/* <!-- Filters Section --> */}
      <StatsFilter
        teams={[team, ...safeOponents]}
        filter={filter}
        handleInputChange={<K extends keyof IFilter>(
          key: K,
          value: IFilter[K]
        ) => handleInputChange(key as string, value as any)}
        matches={safeMatches}
        nets={safeNets}
        rounds={safeRounds}
        players={safePlayers}
        player={player}
      />

      {/* <!-- Stats Overview --> */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Performance Overview</h2>
          {/* <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
            Pro Score: {proScore}
          </div> */}
        </div>

        {/* <!-- Stats Grid --> */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* <!-- Serving Stats --> */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-yellow-400 w-2 h-6 rounded-full"></div>
              <h3 className="font-bold uppercase text-yellow-logo">Serving</h3>
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
  );
}

export default PlayerStatsMain;
