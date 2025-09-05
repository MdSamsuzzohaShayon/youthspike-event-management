"use client";

import React, { useMemo, useState } from "react";
import {
  QueryRef,
  useApolloClient,
  useFragment,
  useQuery,
  useReadQuery,
} from "@apollo/client";
import StatBox from "./StatBox";
import SelectInput from "../elements/SelectInput";
import DateInput from "../elements/DateInput";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import {
  IGetPlayerStats,
  IPlayerStats,
  IPlayerTotalStats,
  IProStats,
} from "@/types";
import StatAddBox from "./StatAddBox";
import usePlayerSocket from "@/hooks/player/usePlayerScoket";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch } from "@/redux/hooks";
import { useUser } from "@/lib/UserProvider";

interface IPlayerStatsMainProps {
  queryRef: QueryRef<{
    getPlayerWithStats: { data: IGetPlayerStats };
  }>;
}

interface IFilter {
  startDate: string;
  endDate: string;
  match: string;
  game: string;
}

function PlayerStatsMain({ queryRef }: IPlayerStatsMainProps) {
  const { data, error } = useReadQuery(queryRef);
  if (error) console.error(error);
  if (!data?.getPlayerWithStats?.data) return <div>No data found</div>;

  const socket = useSocket();
  const dispatch = useAppDispatch();
  const user = useUser();
  const apolloClient = useApolloClient();

  const {
    player,
    team,
    playerstats,
    matches,
    nets,
    multiplayer,
    weight,
    stats,
  } = data.getPlayerWithStats.data;
  

  const [filter, setFilter] = useState<Partial<IFilter>>({});

  usePlayerSocket({
    socket,
    dispatch,
    playerId: player._id,
    apolloClient,
  });

  const safeNets = nets || [];
  const safePlayerstats = playerstats || [];
  const safeMatches = matches || [];

  const totalGames = safePlayerstats?.length || 0;

  // Event handlers
  const handleInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setFilter((prev) => ({ ...prev, [inputEl.name]: inputEl.value }));
  };

  const gameOfTheMatch = useMemo(() => {
    if (!filter.match) return [];
    return safeNets.filter((n) => n.match === filter.match);
  }, [filter.match, safeNets]); // Use safeNets instead of nets

  let totalServe = 0;
  for (const ps of safePlayerstats) {
    totalServe += ps.serveOpportunity;
  }


  
  // ✅ Single-pass aggregation with filtering
  const playerTotalStats = useMemo(() => {
    const totals: IPlayerTotalStats = {
      serveOpportunity: 0,
      serveAce: 0,
      serveCompletionCount: 0,
      servingAceNoTouch: 0,
      receiverOpportunity: 0,
      receivedCount: 0,
      noTouchAcedCount: 0,
      settingOpportunity: 0,
      cleanSets: 0,
      hittingOpportunity: 0,
      cleanHits: 0,
      defensiveOpportunity: 0,
      defensiveConversion: 0,
      break: 0,
      broken: 0,
      matchPlayed: 0,
    };

    // Parse filter dates
    const startDate = filter.startDate
      ? new Date(filter.startDate).getTime()
      : null;
    const endDate = filter.endDate ? new Date(filter.endDate).getTime() : null;

    // Precompute valid matches
    const validMatches = new Set<string>();
    for (const match of safeMatches) {
      const matchTime = match.date ? new Date(match.date).getTime() : null;

      if (startDate && matchTime && matchTime < startDate) continue;
      if (endDate && matchTime && matchTime > endDate) continue;
      if (filter.match && match._id !== filter.match) continue;

      validMatches.add(match._id);
    }

    // Aggregate stats
    for (const ps of safePlayerstats) {
      const matchId = typeof ps.match === "string" ? ps.match : ps.match?._id;
      if (!matchId || !validMatches.has(matchId)) continue;

      const netId = typeof ps.net === "string" ? ps.net : ps.net?._id;
      if (filter.game && netId !== filter.game) continue;

      for (const key in totals) {
        if (Object.prototype.hasOwnProperty.call(totals, key)) {
          const value = ps[key as keyof IPlayerTotalStats];
          if (typeof value === "number") {
            totals[key as keyof IPlayerTotalStats] += value;
          }
        }
      }

      totals.matchPlayed += 1; // ✅ Count this match
    }

    return totals;
  }, [matches, safePlayerstats, filter]);

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
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div className="order-2 md:order-1 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-yellow-logo font-medium mt-1">
            {player.status} | {player.division}
          </p>
          <div className="mt-4 flex gap-4">
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
        <div className="order-1 md:order-2 relative">
          {player.profile ? (
            <CldImage
              alt=""
              src={player.profile}
              height={100}
              width={100}
              className="w-32 h-32 rounded-full"
            />
          ) : (
            <TextImg
              className="w-32 h-32 rounded-full"
              fullText={`${player.firstName}${player.lastName}`}
            />
          )}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 text-xs font-bold rounded-full shadow-md">
            {player.division}
          </div>
        </div>
      </div>

      {/* <!-- Filters Section --> */}
      <div className="bg-gray-900 rounded-xl p-6 mb-12 shadow-lg border border-gray-800">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* <!-- Date Range --> */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <DateInput
              name="startDate"
              label="Start Date"
              handleInputChange={handleInputChange}
            />
            <DateInput
              name="endDate"
              label="End Date"
              handleInputChange={handleInputChange}
            />
          </div>

          {/* <!-- Match Selector --> */}
          <SelectInput
            name="match"
            handleSelect={handleInputChange}
            optionList={safeMatches.map((m, i) => ({
              id: i + 1,
              value: m._id,
              text: m.description || "",
            }))}
          />

          {/* <!-- Game Selector --> */}
          {filter.match && (
            <SelectInput
              name="game"
              handleSelect={handleInputChange}
              optionList={gameOfTheMatch.map((n, i) => ({
                id: i + 1,
                value: n._id,
                text: `Game ${n.num}`,
              }))}
            />
          )}
        </div>
      </div>

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
                value={playerTotalStats.serveCompletionCount}
                total={playerTotalStats.serveOpportunity}
              />
              <StatBox
                label="ACE % (NO 2ND TOUCH)"
                value={playerTotalStats.serveAce}
                total={playerTotalStats.serveOpportunity}
              />
              {/* <StatBox
                label="Ace No Touch %"
                value={playerTotalStats.servingAceNoTouch}
                total={playerTotalStats.serveOpportunity}
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
                value={playerTotalStats.receivedCount}
                total={playerTotalStats.receiverOpportunity}
              />
              <StatBox
                label="Set Assist %"
                value={playerTotalStats.cleanSets}
                total={playerTotalStats.settingOpportunity}
              />
              <StatAddBox
                label="Break +/-"
                plus={playerTotalStats.break}
                minus={playerTotalStats.broken}
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
                value={playerTotalStats.cleanHits}
                total={playerTotalStats.hittingOpportunity}
              />
              <StatBox
                label="Defensive %"
                value={playerTotalStats.defensiveConversion}
                total={playerTotalStats.defensiveOpportunity}
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
