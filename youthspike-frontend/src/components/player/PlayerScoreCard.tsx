/* eslint-disable react/require-default-props */
import React, { useMemo } from "react";
import { useUser } from "@/lib/UserProvider";
import { useAppSelector } from "@/redux/hooks";
import { IPlayer } from "@/types";
import { ETeamPlayer } from "@/types/net";
import { EActionProcess } from "@/types/room";
import PlayerImage from "./PlayerImage";
import PlayerRankBadge from "./PlayerRankBadge";
import RemovePlayerButton from "./RemovePlayerButton";

// ============================================================================
// Types
// ============================================================================

interface IPlayerScoreCardProps {
  player: IPlayer | null;
  subbedRounds?: number[];
  onTop?: boolean;
  playerRankExist?: number | null;
  teamPlayer?: ETeamPlayer;
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string | null) => void;
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;

}



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
  subbedRounds,
}: IPlayerScoreCardProps) {
  const user = useUser();
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const currentRound = useAppSelector((state) => state.rounds.current);
  const { closePSCAvailable, myTeamE } = useAppSelector((state) => state.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

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
        className={`wrapper w-full border border-yellow overflow-hidden flex ${onTop ? "flex-col rounded-t-lg" : "flex-col-reverse rounded-b-lg"
          } items-center bg-yellow-logo`}
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
          className={`w-22 h-22 sm:w-8 sm:h-8 md:w-22 md:h-22 cursor-pointer relative object-center object-cover`}
        >
          {shouldShowEvacuateButton && !onTop && (
            <RemovePlayerButton
              player={player}
              myTeamE={myTeamE}
              currentRound={currentRound}
              closePSCAvailable={closePSCAvailable}
              onRemove={handleEvacuatePlayer}
            />
          )}
          <PlayerImage
            player={player}
            onTop={onTop}
            shouldShowAddPlayer={shouldShowAddPlayer || false}
            onImageClick={handleDropDown}
            currRound={currentRound}
            myTeamE={myTeamE}
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