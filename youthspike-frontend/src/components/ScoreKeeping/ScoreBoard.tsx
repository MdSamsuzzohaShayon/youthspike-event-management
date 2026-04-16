import React, { useCallback, useMemo } from "react";
import {
  ETeam,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { toOrdinal } from "@/utils/helper";
import { CldImage } from "next-cloudinary";
import TextImg from "@/components/elements/TextImg";
import Image from "next/image";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface IScoreBoardProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  handleOpenPlays: (e: React.SyntheticEvent) => void;
  awardTo: ETeam | null;
  setAwardTo: React.Dispatch<React.SetStateAction<ETeam | null>>;
  currPlays: IServerReceiverSinglePlay[];
  revertPlayEl: React.RefObject<HTMLDialogElement | null>;
  stickyScoreBoardRef: React.RefObject<HTMLDivElement | null>;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}

interface TeamCardConfig {
  team: ITeam | null;
  score: number;
  teamE: ETeam;
  gradient: string;
  borderHover: string;
  scoreBg: string;
}

interface ServerReceiverDisplayProps {
  player: IPlayer;
  role: "Serving" | "Receiving";
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Displays the server or receiver player information
 */
const ServerReceiverDisplay: React.FC<ServerReceiverDisplayProps> = ({ player, role }) => {
  if (!player) return null;

  return (
    <div className="group relative overflow-hidden flex flex-col gap-2 md:gap-3 p-3 md:p-4 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300 shadow-lg hover:shadow-yellow-500/10 h-full">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative flex items-center gap-2">
        <div className="relative">
          {player.profile ? (
            <CldImage
              src={player.profile}
              alt={`${player.firstName} ${player.lastName}`}
              width={64}
              height={64}
              className="object-cover object-center w-8 h-8 rounded-full ring-2 ring-yellow-500/50 group-hover:ring-yellow-400 transition-all"
              crop="fit"
            />
          ) : (
            <TextImg
              className="w-8 h-8 rounded-full ring-2 ring-yellow-500/50"
              fullText={`${player.firstName}${player.lastName}`}
            />
          )}
        </div>
        <div className="text-yellow-400 uppercase text-xs md:text-sm font-semibold tracking-wider">
          {role}
        </div>
      </div>
      <h5 className="text-white font-medium text-sm md:text-base line-clamp-1">
        {player.firstName} {player.lastName}
      </h5>
    </div>
  );
};

/**
 * Animated serving ball indicator
 */
const ServingBallIndicator: React.FC = () => (
  <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 animate-pulse">
    <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping" />
    <Image
      src="/imgs/spikeball-logo.webp"
      height={48}
      width={48}
      className="relative w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_15px_rgba(255,255,0,0.8)] animate-bounce"
      alt="serving-ball-logo"
    />
  </div>
);

/**
 * Team logo display component
 */
const TeamLogo: React.FC<{ team: ITeam | null; isAwarded: boolean }> = ({ team, isAwarded }) => (
  <div className="relative">
    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
      isAwarded ? "from-yellow-400 to-yellow-600" : "from-gray-600 to-gray-800"
    } opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
    {team?.logo ? (
      <CldImage
        width={80}
        height={80}
        alt={team.name}
        src={team.logo}
        className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain rounded-xl bg-white/10 p-2 shadow-lg"
        crop="fit"
      />
    ) : (
      <TextImg
        className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl shadow-lg"
        fullText={team?.name}
      />
    )}
  </div>
);

/**
 * Score display component with glow effect
 */
const ScoreDisplay: React.FC<{ score: number; gradient: string }> = ({ score, gradient }) => (
  <div className="relative">
    {/* Score glow effect */}
    <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
    
    <div className={`relative bg-gradient-to-br ${gradient} rounded-xl shadow-2xl overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative px-6 md:px-8 py-4 md:py-5">
        <span className="text-5xl md:text-6xl lg:text-7xl font-black text-white tabular-nums tracking-tighter">
          {score}
        </span>
      </div>
    </div>
  </div>
);

/**
 * Individual team card component
 */
const TeamCard: React.FC<{
  config: TeamCardConfig;
  isAwarded: boolean;
  isServing: boolean;
  onSelect: (teamE: ETeam) => void;
}> = ({ config, isAwarded, isServing, onSelect }) => {
  const { team, score, teamE, gradient, borderHover, scoreBg } = config;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500 cursor-pointer
        ${isAwarded ? "ring-2 ring-yellow-400 shadow-2xl shadow-yellow-500/20 scale-[1.02]" : "hover:scale-[1.01]"}
      `}
      onClick={() => onSelect(teamE)}
    >
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
        isAwarded ? "opacity-100" : "opacity-80 group-hover:opacity-100"
      } transition-opacity duration-500`} />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20" />
      
      {/* Border gradient effect */}
      <div className={`absolute inset-0 rounded-2xl md:rounded-3xl border ${
        isAwarded ? "border-yellow-400" : `border-gray-700 ${borderHover}`
      } transition-colors duration-300 pointer-events-none`} />
      
      {/* Content */}
      <div className="relative p-5 md:p-7 lg:p-8 flex flex-col items-center">
        {/* Animated Serving Ball Indicator */}
        {isServing && <ServingBallIndicator />}

        {/* Team Name */}
        <h4 className={`text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-wider text-center mb-4 md:mb-6 ${
          isAwarded ? "text-yellow-300" : "text-white"
        }`}>
          {team?.name}
        </h4>

        {/* Logo and Score Container */}
        <div className={`flex items-center justify-center gap-4 md:gap-6 lg:gap-8 ${
          teamE === ETeam.teamB ? "flex-row-reverse" : ""
        }`}>
          <TeamLogo team={team} isAwarded={isAwarded} />
          <ScoreDisplay score={score} gradient={scoreBg} />
        </div>

        {/* Award indicator */}
        {isAwarded && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};

/**
 * Action buttons component
 */
const ActionButtons: React.FC<{
  hasPlays: boolean;
  onRevert: () => void;
  onOpenPlays: (e: React.SyntheticEvent) => void;
  currentPlayNumber: number;
}> = ({ hasPlays, onRevert, onOpenPlays, currentPlayNumber }) => (
  <div className="mt-6 md:mt-8 flex flex-wrap justify-center items-center gap-3">
    {hasPlays && (
      <button
        className="group relative px-6 py-2.5 md:px-8 md:py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 border border-gray-700 hover:border-red-500/50"
        onClick={onRevert}
      >
        <span className="relative z-10 flex items-center gap-2">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Revert Play
        </span>
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-red-600/20 to-transparent transition-transform duration-500" />
      </button>
    )}
    
    <button
      onClick={onOpenPlays}
      className="group relative px-6 py-2.5 md:px-8 md:py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-105"
    >
      <span className="relative z-10 flex items-center gap-2">
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {`${toOrdinal(currentPlayNumber)} Play`}
      </span>
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-white/20 to-transparent transition-transform duration-500" />
    </button>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

function ScoreBoard({
  currServerReceiver,
  teamA,
  teamB,
  handleOpenPlays,
  awardTo,
  setAwardTo,
  currPlays,
  revertPlayEl,
  stickyScoreBoardRef,
  teamAPlayers,
  teamBPlayers,
}: IScoreBoardProps) {
  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Auto-scroll to top for mobile when team is selected
   */
  const handleTeamSelect = useCallback((teamE: ETeam) => {
    setAwardTo(teamE);

    if (stickyScoreBoardRef.current && window.innerWidth < 768) {
      setTimeout(() => {
        stickyScoreBoardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [setAwardTo, stickyScoreBoardRef]);

  /**
   * Handle revert play action with error handling
   */
  const handleRevertPlay = useCallback(() => {
    try {
      revertPlayEl.current?.showModal();
    } catch (error) {
      console.error("Failed to open revert play dialog:", error);
    }
  }, [revertPlayEl]);

  /**
   * Handle open plays with error handling
   */
  const handleOpenPlaysSafe = useCallback((e: React.SyntheticEvent) => {
    try {
      handleOpenPlays(e);
    } catch (error) {
      console.error("Failed to open plays:", error);
    }
  }, [handleOpenPlays]);

  // ==========================================================================
  // Memoized Computations
  // ==========================================================================

  /**
   * Precompute player lookup map for O(1) access
   */
  const playerMap = useMemo(() => {
    const map: Record<string, IPlayer> = {};
    teamAPlayers.forEach((player) => {
      if (player?._id) map[player._id] = player;
    });
    teamBPlayers.forEach((player) => {
      if (player?._id) map[player._id] = player;
    });
    return map;
  }, [teamAPlayers, teamBPlayers]);

  /**
   * Get server or receiver player for a team
   */
  const getServerOrReceiverPlayer = useCallback((teamE: ETeam) => {
    if (!currServerReceiver?.server || !currServerReceiver?.receiver) {
      return null;
    }

    const isTeamAServing = teamAPlayers.some(
      (player) => player._id === currServerReceiver.server
    );
    const isTeamBServing = teamBPlayers.some(
      (player) => player._id === currServerReceiver.server
    );

    let role: "Serving" | "Receiving" | null = null;
    let playerId: string | null = null;

    if (
      (teamE === ETeam.teamA && isTeamAServing) ||
      (teamE === ETeam.teamB && isTeamBServing)
    ) {
      role = "Serving";
      playerId = String(currServerReceiver.server);
    } else if (
      (teamE === ETeam.teamA && isTeamBServing) ||
      (teamE === ETeam.teamB && isTeamAServing)
    ) {
      role = "Receiving";
      playerId = String(currServerReceiver.receiver);
    }

    if (!role || !playerId) return null;

    const player = playerMap[playerId];
    if (!player) return null;

    return { player, role };
  }, [currServerReceiver, playerMap, teamAPlayers, teamBPlayers]);

  /**
   * Check if a team is currently serving
   */
  const isTeamServing = useCallback((teamE: ETeam): boolean => {
    if (!currServerReceiver?.server) return false;

    if (teamE === ETeam.teamA) {
      return teamAPlayers.some((player) => player._id === currServerReceiver.server);
    }
    return teamBPlayers.some((player) => player._id === currServerReceiver.server);
  }, [currServerReceiver?.server, teamAPlayers, teamBPlayers]);

  /**
   * Prepare team card configurations
   */
  const teamConfigs = useMemo((): TeamCardConfig[] => [
    {
      team: teamA,
      score: currServerReceiver?.teamAScore ?? 0,
      teamE: ETeam.teamA,
      gradient: "from-emerald-600/20 to-emerald-900/30",
      borderHover: "hover:border-emerald-400/50",
      scoreBg: "from-emerald-500 to-emerald-700",
    },
    {
      team: teamB,
      score: currServerReceiver?.teamBScore ?? 0,
      teamE: ETeam.teamB,
      gradient: "from-blue-600/20 to-blue-900/30",
      borderHover: "hover:border-blue-400/50",
      scoreBg: "from-blue-500 to-blue-700",
    },
  ], [teamA, teamB, currServerReceiver?.teamAScore, currServerReceiver?.teamBScore]);

  // ==========================================================================
  // Render Logic
  // ==========================================================================

  const serverReceiverA = getServerOrReceiverPlayer(ETeam.teamA);
  const serverReceiverB = getServerOrReceiverPlayer(ETeam.teamB);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
      {/* Mobile Scoreboard - Server/Receiver Row */}
      <div className="w-full flex md:hidden gap-3 justify-between items-stretch mb-4">
        <div className="flex-1">
          {serverReceiverA && (
            <ServerReceiverDisplay player={serverReceiverA.player} role={serverReceiverA.role} />
          )}
        </div>
        <div className="flex-1">
          {serverReceiverB && (
            <ServerReceiverDisplay player={serverReceiverB.player} role={serverReceiverB.role} />
          )}
        </div>
      </div>

      {/* Desktop Server/Receiver Row */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-full max-w-xs">
            {serverReceiverA && (
              <ServerReceiverDisplay player={serverReceiverA.player} role={serverReceiverA.role} />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="w-full max-w-xs">
            {serverReceiverB && (
              <ServerReceiverDisplay player={serverReceiverB.player} role={serverReceiverB.role} />
            )}
          </div>
        </div>
      </div>

      {/* Teams & Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        {teamConfigs.map((config) => (
          <TeamCard
            key={config.team?.name ?? config.teamE}
            config={config}
            isAwarded={awardTo === config.teamE}
            isServing={isTeamServing(config.teamE)}
            onSelect={handleTeamSelect}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <ActionButtons
        hasPlays={currPlays.length > 0}
        onRevert={handleRevertPlay}
        onOpenPlays={handleOpenPlaysSafe}
        currentPlayNumber={currServerReceiver?.mutate ?? 1}
      />
    </div>
  );
}

export default ScoreBoard;