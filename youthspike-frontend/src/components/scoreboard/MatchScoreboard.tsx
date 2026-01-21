"use client";

import { useReadQuery, QueryRef, useQuery } from "@apollo/client/react";
import {
  EMessage,
  IMatchExpRel
} from "@/types";
import LocalStorageService from "@/utils/LocalStorageService";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUserFromCookie } from "@/utils/cookie";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Loader from "../elements/Loader";
import { setMessage } from "@/redux/slices/elementSlice";
import { useSocket } from "@/lib/SocketProvider";
import { calcScore } from "@/utils/scoreCalc";
import { setMatchScore, setRoundMap } from "@/redux/slices/matchesSlice";
import useMatchSocket from "@/hooks/match/useMatchSocket";
import useNetMaps from "@/hooks/score-keeping/useNetMaps";
import MatchPublicView from "../match/MatchPublicView";
import { GET_MATCH_DETAIL } from "@/graphql/matches";
import QRCode from "../elements/QRCode.tsx";
import { FRONTEND_URL } from "@/utils/keys";
import Image from "next/image";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface IMatchScoreBoardProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
  matchId: string;
}

interface IMatchData {
  getMatch: { data: IMatchExpRel };
}

// ============================================================================
// Sub-Components
// ============================================================================

const HeaderTitle = () => (
  <div className="flex-1 text-center lg:text-left">
    <div className="inline-flex flex-col items-center lg:items-start">
      {/* Decorative dots */}
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

      {/* Live status indicator */}
      <div className="flex items-center space-x-2 mt-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-300 font-medium tracking-wide">
          LIVE SCORING ACTIVE
        </span>
      </div>
    </div>
  </div>
);

interface IRefreshControlsProps {
  lastRefreshed: Date;
  isLoading: boolean;
  isAutoRefresh: boolean;
  streamUrl?: string;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
}

const RefreshControls = ({
  lastRefreshed,
  isLoading,
  isAutoRefresh,
  streamUrl,
  onRefresh,
  onToggleAutoRefresh,
}: IRefreshControlsProps) => (
  <div className="flex flex-col justify-start items-start mt-2 gap-2">
    <div className="text-sm text-gray-300 font-medium tracking-wide">
      Last updated: {lastRefreshed.toLocaleTimeString()}
      {isLoading && (
        <span className="ml-2 text-blue-500">Refreshing...</span>
      )}
    </div>
    <div className="flex gap-2">
      {streamUrl && (
        <Link
          href={streamUrl}
          className="btn-info"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/icons/live.svg"
            height={20}
            width={20}
            className="w-18 svg-black"
            alt="live-icon"
          />
        </Link>
      )}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="btn-info flex items-center justify-center gap-x-2"
        aria-label="Refresh match data"
      >
        <Image
          src="/icons/refresh.svg"
          height={20}
          width={20}
          className="w-4 svg-black"
          alt="refresh-icon"
        />
        Refresh Now
      </button>
      <button
        onClick={onToggleAutoRefresh}
        className={`${isAutoRefresh ? "btn-success" : "btn-secondary"
          } flex items-center justify-center gap-x-2`}
        aria-label={`Auto refresh is ${isAutoRefresh ? "on" : "off"}`}
      >
        <Image
          src={isAutoRefresh ? "/icons/sync.svg" : "/icons/no-sync.svg"}
          height={20}
          width={20}
          className="w-4 svg-black"
          alt={`${isAutoRefresh ? "sync" : "no-sync"}-icon`}
        />
        {isAutoRefresh ? "ON" : "OFF"}
      </button>
    </div>
  </div>
);

interface IQRCodeSectionProps {
  matchId: string;
}

const QRCodeSection = ({ matchId }: IQRCodeSectionProps) => (
  <div className="flex flex-col items-center space-y-4">
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>

      {/* QR Code container */}
      <div className="relative bg-white p-3 rounded-xl shadow-2xl border-2 border-yellow-400/50 transform group-hover:scale-105 transition-transform duration-300">
        <div className="w-20 md:w-28 aspect-square">
          <QRCode
            value={`${FRONTEND_URL}/matches/${matchId}/scoreboard`}
          />
        </div>

        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400 rounded-br-lg"></div>
      </div>
    </div>

    {/* Label */}
    <div className="text-center">
      <p className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
        Scan to Follow
      </p>
      <p className="text-[10px] text-gray-400 mt-1">Live Scoreboard</p>
    </div>
  </div>
);

interface IFullscreenButtonProps {
  isFullscreen: boolean;
  isExpandedScreen: boolean;
  onToggle: () => void;
  onExpandedToggle: () => void;
}

const FullscreenButton = ({ isFullscreen, isExpandedScreen, onToggle, onExpandedToggle }: IFullscreenButtonProps) => (
  <div className="flex items-center justify-center lg:justify-end">
    <div className="relative group">
      <button
        onClick={onToggle}
        className="relative flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400/30 rounded-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-400/20"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <div className="relative w-6 h-6">
          <Image
            role="presentation"
            className="w-full h-full filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
            src={isFullscreen ? "/icons/minimize.svg" : "/icons/maximize.svg"}
            width={24}
            height={24}
            alt={isFullscreen ? "Minimize" : "Maximize"}
          />
        </div>

        {/* Tooltip */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </button>
      <button
        onClick={onExpandedToggle}
        className="relative flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400/30 rounded-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-400/20"
        aria-label={isExpandedScreen ? "Exit Expanded fullscreen" : "Enter Expandedfullscreen"}
      >
        <div className="relative w-6 h-6">
          <Image
            role="presentation"
            className="w-full h-full filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
            src={isExpandedScreen ? "/icons/minimize.svg" : "/icons/expand.svg"}
            width={24}
            height={24}
            alt={isExpandedScreen ? "Minimize" : "Maximize"}
          />
        </div>

        {/* Tooltip */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          {isExpandedScreen ? "Exit Expanded Fullscreen" : "Enter Expanded Fullscreen"}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </button>
    </div>
  </div>
);

const HeaderBackground = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-yellow-900/20 rounded-2xl shadow-2xl"></div>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/0 animate-pulse-slow"></div>
  </>
);

// ============================================================================
// Constants
// ============================================================================

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

// ============================================================================
// Main Component
// ============================================================================

export function MatchScoreBoard({ queryRef, matchId }: IMatchScoreBoardProps) {
  // ============================================================================
  // Data Fetching
  // ============================================================================

  const { data: initialData, error: initialError } = useReadQuery(queryRef);
  const {
    data: refreshedData,
    error: refreshError,
    refetch,
    loading: isRefreshing,
  } = useQuery<IMatchData>(GET_MATCH_DETAIL, {
    variables: { matchId },
    skip: true,
    notifyOnNetworkStatusChange: true,
  });

  const matchData = (refreshedData || initialData) as IMatchData;
  const fetchError = refreshError || initialError;
  const match = useMemo(() => matchData?.getMatch?.data, [matchData]);

  // ============================================================================
  // Redux & Socket
  // ============================================================================

  const dispatch = useAppDispatch();
  const socket = useSocket();

  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const {
    currentRoundNets,
    nets: allNets,
    currNetNum: currentNetNumber,
  } = useAppSelector((state) => state.nets);
  const {
    serverReceiverPlays,
    serverReceiversOnNet,
    currentServerReceiver,
  } = useAppSelector((state) => state.serverReceiverOnNets);
  const { match: currentMatch } = useAppSelector((state) => state.matches);

  const netByNumber = useNetMaps(currentRoundNets);

  // ============================================================================
  // Local State
  // ============================================================================

  const containerRef = useRef<HTMLDivElement>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<Date>(new Date());
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [isExpandedMode, setIsExpandedMode] = useState<boolean>(false);

  // ============================================================================
  // Socket Connection
  // ============================================================================

  useMatchSocket({
    currNetNum: currentNetNumber,
    netByNum: netByNumber,
    socket,
    match: currentMatch,
    teamA: teamA || null,
    teamB: teamB || null,
    allNets,
    currRound: currentRound,
    currRoundNets: currentRoundNets,
    roundList,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver: currentServerReceiver,
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleManualRefresh = useCallback(async () => {
    try {
      await refetch();
      setLastRefreshedTime(new Date());
      console.info("Match data refreshed at:", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to refresh match data:", error);
    }
  }, [refetch]);

  const toggleFullscreenMode = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreenMode(true);
    } else {
      document.exitFullscreen();
      setIsFullscreenMode(false);
    }
  }, []);

  const toggleExpandedScreenMode = useCallback(() => {
    // Change an few class name
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsExpandedMode(true);
    } else {
      document.exitFullscreen();
      setIsExpandedMode(false);
    }
  }, [])

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((prev) => !prev);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-refresh interval
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const intervalId = setInterval(handleManualRefresh, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAutoRefreshEnabled, handleManualRefresh]);

  // Organize match data
  useEffect(() => {
    const organizeMatchData = async () => {
      if (!match?.event?._id) {
        dispatch(
          setMessage({
            type: EMessage.ERROR,
            message: "Cannot find any event"
          })
        );
        return;
      }

      if (!match._id) {
        console.warn("No match ID found, skipping data organization");
        return;
      }

      const userDetail = getUserFromCookie();
      await organizeFetchedData({
        matchData: match,
        token: userDetail.token,
        userInfo: userDetail.info,
        matchId: match._id,
        dispatch,
      });
    };

    if (match) {
      organizeMatchData();
    }

    if (match?.event?._id) {
      LocalStorageService.setEvent(match.event._id);
    }
  }, [match, dispatch]);

  // Calculate and update scores
  useEffect(() => {
    const { matchScore, roundMap } = calcScore(allNets, roundList);
    dispatch(setMatchScore(matchScore));
    dispatch(setRoundMap(roundMap));
  }, [allNets, roundList, dispatch]);

  // ============================================================================
  // Render Guards
  // ============================================================================

  if (fetchError) {
    console.error("Error loading match:", fetchError);
    return <div className="text-red-500">Error loading match details</div>;
  }

  if (!match) {
    return <Loader />;
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className={`min-h-screen container px-4 mx-auto ${isFullscreenMode ? "fixed inset-0 z-50 overflow-auto" : ""
        }`}
    >
      {/* Header Controls */}
      {!isExpandedMode && (
        <div className="relative mb-8">
          <HeaderBackground />

          <div className="relative flex flex-col lg:flex-row items-center justify-between p-6 lg:p-8 space-y-6 lg:space-y-0">
            <div className="flex-1">
              <HeaderTitle />
              <RefreshControls
                lastRefreshed={lastRefreshedTime}
                isLoading={isRefreshing}
                isAutoRefresh={isAutoRefreshEnabled}
                streamUrl={match?.streamUrl || undefined}
                onRefresh={handleManualRefresh}
                onToggleAutoRefresh={toggleAutoRefresh}
              />
            </div>

            <QRCodeSection matchId={matchId} />
            <FullscreenButton
              isFullscreen={isFullscreenMode}
              isExpandedScreen={isExpandedMode}
              onToggle={toggleFullscreenMode}
              onExpandedToggle={toggleExpandedScreenMode}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <MatchPublicView
        currRound={currentRound}
        currRoundNets={currentRoundNets}
        nets={allNets}
        roundList={roundList}
        teamA={teamA || null}
        teamB={teamB || null}
        serverReceiversOnNet={serverReceiversOnNet}
        currServerReceiver={currentServerReceiver}
        matchId={match._id}
        serverReceiverPlays={serverReceiverPlays}
        currMatch={match}
        isExpandedMode={isExpandedMode}
      />

      {isExpandedMode && (
        <button
          onClick={toggleExpandedScreenMode}
          className="relative flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400/30 rounded-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-400/20"
          aria-label={isExpandedMode ? "Exit Expanded fullscreen" : "Enter Expandedfullscreen"}
        >
          <div className="relative w-6 h-6">
            <Image
              role="presentation"
              className="w-full h-full filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
              src={isExpandedMode ? "/icons/minimize.svg" : "/icons/expand.svg"}
              width={24}
              height={24}
              alt={isExpandedMode ? "Minimize" : "Maximize"}
            />
          </div>

          {/* Tooltip */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            {isExpandedMode ? "Exit Expanded Fullscreen" : "Enter Expanded Fullscreen"}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </button>
      )}
    </div>
  );
}

export default MatchScoreBoard;