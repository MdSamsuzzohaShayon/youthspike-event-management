/* eslint-disable react/require-default-props */
import React, { useMemo } from "react";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { useUser } from "@/lib/UserProvider";
import { useAppSelector } from "@/redux/hooks";
import { IPlayer, IPlayerRankingExpRel } from "@/types";
import { ETeamPlayer } from "@/types/net";
import { EActionProcess } from "@/types/room";
import { ETeam } from "@/types/team";
import { screen } from "@/utils/constant";

// ============================================================================
// Types
// ============================================================================

interface PlayerScoreCardProps {
  player: IPlayer | null;
  screenWidth: number;
  myTeamE: ETeam;
  subbedRounds?: number[];
  tapr?: IPlayerRankingExpRel | null; // Team A Player Ranking
  tbpr?: IPlayerRankingExpRel | null; // Team B Player Ranking
  onTop?: boolean;
  playerRankExist?: number | null;
  teamPlayer?: ETeamPlayer;
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string | null) => void;
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
}

interface PlayerImageProps {
  player: IPlayer | null;
  onTop: boolean;
  shouldShowAddPlayer: boolean;
  onImageClick: (e: React.SyntheticEvent) => void;
}

interface PlayerRankBadgeProps {
  playerRank: number;
  subbedRounds?: number[];
  onTop: boolean;
}

interface RemovePlayerButtonProps {
  player: IPlayer | null;
  myTeamE: ETeam;
  currentRound: any;
  canClosePSC: boolean;
  onRemove: (e: React.SyntheticEvent, playerId: string | null) => void;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Displays player image or placeholder/add button
 */
const PlayerImage: React.FC<PlayerImageProps> = ({
  player,
  onTop,
  shouldShowAddPlayer,
  onImageClick,
}) => {
  // Player has profile image
  if (player?.profile) {
    return (
      <CldImage
        crop="fit"
        alt={player.firstName}
        width="200"
        height="200"
        className="w-full h-full object-top object-cover"
        src={player.profile}
        onClick={onImageClick}
      />
    );
  }

  // Show add player button
  if (!onTop && !player && shouldShowAddPlayer) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Image
          width={100}
          height={100}
          src="/icons/plus.svg"
          alt="Add player"
          className={`${
            onTop ? "svg-white" : "svg-black"
          } w-5/6 md:h-full object-top object-cover`}
          role="presentation"
          onClick={onImageClick}
        />
      </div>
    );
  }

  // Empty placeholder
  return (
    <Image
      width={100}
      height={100}
      src="/empty-img.jpg"
      alt="No player"
      className="w-full h-full object-center object-cover"
      role="presentation"
    />
  );
};

/**
 * Displays player rank and substitution information
 */
const PlayerRankBadge: React.FC<PlayerRankBadgeProps> = ({
  playerRank,
  subbedRounds,
  onTop,
}) => {
  return (
    <div
      className={`bg-yellow-logo text-center text-black ${
        onTop ? "rounded-b-lg" : "rounded-t-lg"
      }`}
    >
      <p className="rank"># {playerRank}</p>
      {subbedRounds && subbedRounds.length > 0 && (
        <div className="relative">
          <p>
            {subbedRounds.map((roundNumber, index) => {
              const isLastItem = index + 1 === subbedRounds.length;
              return `S${roundNumber}${isLastItem ? "" : ", "}`;
            })}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Remove/evacuate player button
 */
const RemovePlayerButton: React.FC<RemovePlayerButtonProps> = ({
  player,
  myTeamE,
  currentRound,
  canClosePSC,
  onRemove,
}) => {
  const shouldShowForTeamA =
    myTeamE === ETeam.teamA && canClosePSC && !currentRound?.teamAScore;

  const shouldShowForTeamB =
    myTeamE === ETeam.teamB && canClosePSC && !currentRound?.teamBScore;

  if (!shouldShowForTeamA && !shouldShowForTeamB) {
    return null;
  }

  return (
    <div className="absolute top-1 right-1 w-4 bg-black-logo rounded-full">
      <Image
        width={12}
        height={12}
        src="/icons/close.svg"
        className="w-full h-full svg-white"
        alt="Remove player"
        role="presentation"
        onClick={(e) => onRemove(e, player?._id || null)}
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

function PlayerScoreCard({
  player,
  onTop = false,
  playerRankExist,
  teamPlayer,
  evacuatePlayer,
  dropdownPlayer,
  screenWidth,
  myTeamE,
  subbedRounds,
  tapr: teamAPlayerRanking,
  tbpr: teamBPlayerRanking,
}: PlayerScoreCardProps) {
  const user = useUser();
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const currentRound = useAppSelector((state) => state.rounds.current);
  const canClosePSC = useAppSelector((state) => state.matches.closePSCAvailable);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Check if current round is in LINEUP or CHECKIN process
   */
  const isInLineupOrCheckinProcess = useMemo(() => {
    if (!currentRound) return false;

    const validProcesses = [EActionProcess.LINEUP, EActionProcess.CHECKIN];
    return (
      validProcesses.includes(currentRound.teamAProcess) ||
      validProcesses.includes(currentRound.teamBProcess)
    );
  }, [currentRound]);

  /**
   * Check if both teams are in CHECKIN process or one in CHECKIN and other in LINEUP
   */
  const canAddPlayer = useMemo(() => {
    if (!currentRound) return false;

    const { teamAProcess, teamBProcess } = currentRound;
    const bothCheckin =
      teamAProcess === EActionProcess.CHECKIN &&
      teamBProcess === EActionProcess.CHECKIN;

    const mixedProcess =
      (teamAProcess === EActionProcess.CHECKIN &&
        teamBProcess === EActionProcess.LINEUP) ||
      (teamAProcess === EActionProcess.LINEUP &&
        teamBProcess === EActionProcess.CHECKIN);

    return bothCheckin || mixedProcess;
  }, [currentRound]);

  /**
   * Determine if evacuate button should be shown
   */
  const shouldShowEvacuateButton = useMemo(() => {
    return (
      player &&
      user.token &&
      evacuatePlayer &&
      currentRoom &&
      currentRound &&
      isInLineupOrCheckinProcess
    );
  }, [
    player,
    user.token,
    evacuatePlayer,
    currentRoom,
    currentRound,
    isInLineupOrCheckinProcess,
  ]);

  /**
   * Determine if add player button should be shown
   */
  const shouldShowAddPlayer = useMemo(() => {
    return (
      !player &&
      user.token &&
      evacuatePlayer &&
      currentRoom &&
      currentRound &&
      canAddPlayer
    );
  }, [player, user.token, evacuatePlayer, currentRoom, currentRound, canAddPlayer]);

  /**
   * Calculate player rank from rankings or use existing rank
   */
  const playerRank = useMemo(() => {
    if (playerRankExist) {
      return playerRankExist;
    }

    const allRankings = [];
    if (teamAPlayerRanking?.rankings) {
      allRankings.push(...teamAPlayerRanking.rankings);
    }
    if (teamBPlayerRanking?.rankings) {
      allRankings.push(...teamBPlayerRanking.rankings);
    }

    const rankingEntry = allRankings.find((p) => p.player._id === player?._id);
    return rankingEntry?.rank || 0;
  }, [playerRankExist, teamAPlayerRanking, teamBPlayerRanking, player]);

  /**
   * Calculate image container height based on screen width
   */
  const imageContainerHeight = useMemo(() => {
    return screenWidth > screen.xs ? "h-20" : "h-24";
  }, [screenWidth]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleDropDown = (e: React.SyntheticEvent): void => {
    if (dropdownPlayer && teamPlayer) {
      dropdownPlayer(e, teamPlayer);
    }
  };

  const handleEvacuatePlayer = (
    e: React.SyntheticEvent,
    playerId: string | null
  ): void => {
    if (evacuatePlayer && teamPlayer) {
      evacuatePlayer(teamPlayer, playerId);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-end">
      {/* Rank badge on bottom (for non-top players) */}
      {player && !onTop && (
        <PlayerRankBadge
          playerRank={playerRank}
          subbedRounds={subbedRounds}
          onTop={onTop}
        />
      )}

      {/* Main player card */}
      <div
        className={`wrapper w-full border border-yellow overflow-hidden flex ${
          onTop ? "flex-col rounded-t-lg" : "flex-col-reverse rounded-b-lg"
        }`}
      >
        {/* Player name section */}
        <div className="p-rank bg-yellow-logo w-full flex flex-wrap items-center justify-center">
          <p className="p-name max-three-line break-all text-c-sm uppercase text-black-logo text-center font-bold leading-3 pt-1">
            {player?.firstName || ""}
            {player?.lastName && (
              <>
                <br />
                <small>{player.lastName}</small>
              </>
            )}
          </p>
        </div>

        {/* Player image section */}
        <div
          className={`p-img-wrap cursor-pointer relative w-full ${imageContainerHeight}`}
        >
          {shouldShowEvacuateButton && !onTop && (
            <RemovePlayerButton
              player={player}
              myTeamE={myTeamE}
              currentRound={currentRound}
              canClosePSC={canClosePSC}
              onRemove={handleEvacuatePlayer}
            />
          )}
          <PlayerImage
            player={player}
            onTop={onTop}
            shouldShowAddPlayer={shouldShowAddPlayer || false}
            onImageClick={handleDropDown}
          />
        </div>
      </div>

      {/* Rank badge on top (for top players) */}
      {player && onTop && (
        <PlayerRankBadge
          playerRank={playerRank}
          subbedRounds={subbedRounds}
          onTop={onTop}
        />
      )}
    </div>
  );
}

export default PlayerScoreCard;