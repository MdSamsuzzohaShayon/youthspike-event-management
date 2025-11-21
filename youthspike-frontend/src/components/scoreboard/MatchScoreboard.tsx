"use client";

import { useReadQuery, QueryRef, useQuery } from "@apollo/client/react";
import {
  EMessage,
  EPlayerStatus,
  ETeam,
  IMatchExpRel,
  UserRole,
} from "@/types";
import LocalStorageService from "@/utils/LocalStorageService";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUserFromCookie } from "@/utils/cookie";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Loader from "../elements/Loader";
import { setMessage } from "@/redux/slices/elementSlice";
import { useSocket } from "@/lib/SocketProvider";
import { calcRoundScore } from "@/utils/scoreCalc";
import { setTeamScore } from "@/redux/slices/matchesSlice";
import useMatchSocket from "@/hooks/match/useMatchSocket";
import useNetMaps from "@/hooks/score-keeping/useNetMaps";
import MatchPublicView from "../match/MatchPublicView";
import { GET_MATCH_DETAIL } from "@/graphql/matches";
import QRCode from "../elements/QRCode.tsx";
import { FRONTEND_URL } from "@/utils/keys";
import Image from "next/image";

interface IMatchScoreBoardProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
  matchId: string;
}

export function MatchScoreBoard({ queryRef, matchId }: IMatchScoreBoardProps) {
  // Use both the initial queryRef and useQuery for refreshing
  const { data: initialData, error: initialError } = useReadQuery(queryRef);

  // Additional useQuery for manual refreshing
  const {
    data: refreshedData,
    error: refreshError,
    refetch,
    loading,
  } = useQuery(GET_MATCH_DETAIL, {
    variables: { matchId },
    skip: true, // Don't execute immediately, we'll use refetch
    notifyOnNetworkStatusChange: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Use refreshed data if available, otherwise use initial data
  const data = (refreshedData || initialData) as {
    getMatch: { data: IMatchExpRel };
  };
  const error = refreshError || initialError;

  const dispatch = useAppDispatch();
  const socket = useSocket();

  // Selectors (keep your existing selectors)
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { current: currRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const {
    currentRoundNets: currRoundNets,
    nets: allNets,
    currNetNum,
  } = useAppSelector((state) => state.nets);
  const {
    serverReceiverPlays,
    serverReceiversOnNet,
    currentServerReceiver: currServerReceiver,
  } = useAppSelector((state) => state.serverReceiverOnNets);
  const { match: currMatch } = useAppSelector((state) => state.matches);

  const netByNum = useNetMaps(currRoundNets);

  useMatchSocket({
    currNetNum,
    netByNum,
    socket,
    match: currMatch,
    teamA: teamA || null,
    teamB: teamB || null,
    allNets,
    currRound,
    currRoundNets,
    roundList,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver,
  });

  // Memoize the match data
  const match = useMemo(() => data?.getMatch?.data, [data]);

  // Refresh function
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      setLastRefreshed(new Date());
      console.log("Match data refreshed at:", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to refresh match data:", error);
    }
  }, [refetch]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Auto-refresh every 1 minute
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(handleRefresh, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh, handleRefresh]);

  // Organize data only when necessary
  const organizeData = useCallback(async () => {
    if (!match?.event?._id) {
      dispatch(
        setMessage({ type: EMessage.ERROR, message: "Can not find any event" })
      );
      return;
    }

    const userDetail = getUserFromCookie();

    if (match?._id) {
      await organizeFetchedData({
        matchData: match,
        token: userDetail.token,
        userInfo: userDetail.info,
        matchId: match._id,
        dispatch,
      });
    } else {
      console.warn("No match ID found, skipping data organization");
    }
  }, [match, dispatch]);

  // Organize fetched data when match changes
  useEffect(() => {
    if (match) {
      organizeData();
    }
    if (match?.event?._id) {
      LocalStorageService.setEvent(match.event._id);
    }
  }, [match, organizeData]);

  // Calculate points (keep your existing logic)
  useEffect(() => {
    let teamATS = 0,
      teamAPMS = 0,
      teamBTS = 0,
      teamBPMS = 0;

    roundList.forEach((round) => {
      const netList = allNets.filter((n) => n.round === round._id);
      const { score: tas, plusMinusScore: tapms } = calcRoundScore(
        netList,
        round,
        ETeam.teamA
      );
      teamATS += tas;
      teamAPMS += tapms;

      const { score: tbs, plusMinusScore: tbpms } = calcRoundScore(
        netList,
        round,
        ETeam.teamB
      );
      teamBTS += tbs;
      teamBPMS += tbpms;
    });

    dispatch(
      setTeamScore({
        teamATotalScore: teamATS,
        teamBTotalScore: teamBTS,
        teamBPMScore: teamBPMS,
        teamAPMScore: teamAPMS,
      })
    );
  }, [roundList, allNets, dispatch]);

  if (error) {
    console.error("Error loading match:", error);
    return <div className="text-red-500">Error loading match details</div>;
  }

  if (!match) {
    return <Loader />;
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen container px-4 mx-auto ${
        fullscreen ? "fixed inset-0 z-50 overflow-auto" : ""
      }`}
    >
      {/* Header Controls */}
      <div className="relative mb-8">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-yellow-900/20 rounded-2xl shadow-2xl"></div>

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/0 animate-pulse-slow"></div>

        <div className="relative flex flex-col lg:flex-row items-center justify-between p-6 lg:p-8 space-y-6 lg:space-y-0">
          {/* Main Title Section */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex flex-col items-center lg:items-start">
              {/* Decorative elements */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 tracking-tight">
                MATCH VIEW
              </h1>

              {/* Subtle status indicator */}
              <div className="flex items-center space-x-2 mt-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300 font-medium tracking-wide">
                  LIVE SCORING ACTIVE
                </span>
              </div>
            </div>
            {/* Refresh Control Panel */}
            <div className="flex flex-col justify-start items-start mt-2 gap-2">
              <div className="text-sm text-gray-300 font-medium tracking-wide">
                Last updated: {lastRefreshed.toLocaleTimeString()}
                {loading && (
                  <span className="ml-2 text-blue-500">Refreshing...</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="btn-info"
                >
                  Refresh Now
                </button>
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`${
                    isAutoRefresh ? "btn-success" : "btn-secondary"
                  }`}
                >
                  Auto: {isAutoRefresh ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code Container with enhanced styling */}
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>

              {/* QR Code with border animation */}
              <div className="relative bg-white p-3 rounded-xl shadow-2xl border-2 border-yellow-400/50 transform group-hover:scale-105 transition-transform duration-300">
                <div className="w-20 md:w-28 aspect-square">
                  <QRCode
                    value={`${FRONTEND_URL}/matches/${matchId}/scoreboard`}
                  />
                </div>

                {/* Animated corner accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400 rounded-br-lg"></div>
              </div>
            </div>

            {/* QR Code label */}
            <div className="text-center">
              <p className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
                Scan to Follow
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Live Scoreboard</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative group">
              {/* Button with enhanced styling */}
              <button
                onClick={toggleFullscreen}
                className="relative flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400/30 rounded-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-400/20"
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {/* Icon container */}
                <div className="relative w-6 h-6">
                  <Image
                    role="presentation"
                    className="w-full h-full filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
                    src={
                      fullscreen ? "/icons/minimize.svg" : "/icons/maximize.svg"
                    }
                    width={24}
                    height={24}
                    alt={fullscreen ? "Minimize" : "Maximize"}
                  />
                </div>

                {/* Tooltip */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                  {fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <MatchPublicView
        currRound={currRound}
        currRoundNets={currRoundNets}
        nets={allNets}
        roundList={roundList}
        teamA={teamA || null}
        teamB={teamB || null}
        serverReceiversOnNet={serverReceiversOnNet}
        currServerReceiver={currServerReceiver}
        matchId={match._id}
        serverReceiverPlays={serverReceiverPlays}
        currMatch={match}
      />
    </div>
  );
}

export default MatchScoreBoard;
