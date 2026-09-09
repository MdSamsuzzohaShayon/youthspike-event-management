import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

import { useUser } from "@/lib/UserProvider";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";

import {
  EView,
  IMatchRelatives,
  INetRelatives,
  IRoundRelatives,
} from "@/types";
import { IRoom } from "@/types/room";
import { ETeam } from "@/types/team";
import { ETieBreaker } from "@/types/net";

import EmitEvents from "@/utils/socket/EmitEvents";
import LocalStorageService from "@/utils/LocalStorageService";


import TeamScoreInput from "../team/TeamScoreInput";

interface INetPointCardProps {
  net?: INetRelatives | null;
  onNavigateRight: () => void;
  onNavigateLeft: () => void;
  currentRoom: IRoom | null;
  roundList: IRoundRelatives[];
  currentMatch: IMatchRelatives;
}

type TeamScoreKey = "teamAScore" | "teamBScore";

/**
 * Pure helper: Update a specific net score inside a list immutably.
 */
const updateNetScores = (
  nets: INetRelatives[],
  netId: string,
  updatedFields: Partial<INetRelatives>
): INetRelatives[] => {
  return nets.map((net) =>
    net._id === netId ? { ...net, ...updatedFields } : net
  );
};

/**
 * Pure helper: Calculate total round scores.
 * Returns null for both if any score is missing.
 */
const calculateRoundScores = (
  nets: INetRelatives[]
): { teamATotalScore: number | null; teamBTotalScore: number | null } => {
  let teamATotalScore = 0;
  let teamBTotalScore = 0;

  for (const net of nets) {
    if (net.teamAScore == null || net.teamBScore == null) {
      return { teamATotalScore: null, teamBTotalScore: null };
    }
    teamATotalScore += net.teamAScore;
    teamBTotalScore += net.teamBScore;
  }

  return { teamATotalScore, teamBTotalScore };
};

/**
 * Pure helper: Determine winning team based on scores.
 */
const getWinningTeam = (net?: INetRelatives | null): ETeam | null => {
  if (!net || net.teamAScore == null || net.teamBScore == null) return null;

  if (net.teamAScore > net.teamBScore) return ETeam.teamA;
  if (net.teamBScore > net.teamAScore) return ETeam.teamB;

  return null;
};

function NetPointCard({
  net,
  onNavigateRight,
  onNavigateLeft,
  currentRoom,
  roundList,
  currentMatch,
}: INetPointCardProps) {
  const user = useUser();
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const { nets, currentRoundNets } = useAppSelector((state) => state.nets);
  const { myTeamE, opTeamE } = useAppSelector((state) => state.matches);
  const teamA = useAppSelector((state) => state.teams.teamA);

  // Derived state instead of useEffect + useState to avoid unnecessary re-renders
  const winningTeam = useMemo(() => getWinningTeam(net), [net]);

  const isTeamALead = useMemo(() => {
    return (
      user.info?.captainplayer === teamA?.captain?._id ||
      user.info?.cocaptainplayer === teamA?.cocaptain?._id
    );
  }, [user.info, teamA]);

  /**
   * Handle score change for a specific team and net
   */
  const handleScoreChange = useCallback(
    (
      event: React.SyntheticEvent<HTMLInputElement>,
      netId: string | null,
      teamKey: TeamScoreKey
    ) => {
      event.preventDefault();

      // Early exit if prerequisites are missing
      if (!netId || !currentRound) return;

      const rawValue = event.currentTarget.value.trim();
      if (!rawValue) return;

      const parsedScore = Number(rawValue);
      if (isNaN(parsedScore) || parsedScore < 0) return; // Validate numeric and positive

      // Only update the target team's score; the spread operator preserves other fields
      const updatedFields: Partial<INetRelatives> = {
        [teamKey]: parsedScore,
      };

      const updatedCurrentRoundNets = updateNetScores(
        currentRoundNets,
        netId,
        updatedFields
      );

      const updatedAllNets = updateNetScores(nets, netId, updatedFields);

      const { teamATotalScore, teamBTotalScore } =
        calculateRoundScores(updatedCurrentRoundNets);

      const isCompleted = teamATotalScore != null && teamBTotalScore != null;

      const updatedRound: IRoundRelatives = {
        ...currentRound,
        teamAScore: teamATotalScore,
        teamBScore: teamBTotalScore,
        completed: isCompleted,
      };

      const updatedRoundList = roundList.map((round) =>
        round._id === currentRound._id ? updatedRound : round
      );

      // Dispatch all updates (React 18 automatically batches these)
      dispatch(setCurrentRoundNets(updatedCurrentRoundNets));
      dispatch(setNets(updatedAllNets));
      dispatch(setCurrentRound(updatedRound));
      dispatch(setRoundList(updatedRoundList));

      // Emit socket event safely
      if (socket) {
        const updatedNet =
          updatedCurrentRoundNets.find((n) => n._id === netId) ?? null;

        new EmitEvents(socket, dispatch).updatePoints({
          currRoom: currentRoom,
          currRound: currentRound,
          currNet: updatedNet,
          myTeamE,
        });
      }
    },
    [
      currentRound,
      currentRoundNets,
      nets,
      roundList,
      dispatch,
      socket,
      currentRoom,
      myTeamE,
    ]
  );

  /**
   * Navigate to scoreboard view
   */
  const navigateToScoreboard = useCallback(() => {
    if (!currentRound || !net) return;

    LocalStorageService.setMatch(
      currentMatch._id,
      currentRound._id,
      net._id
    );

    window.location.assign(
      `/matches/${currentMatch._id}/scoreboard?view=${EView.NET}`
    );
  }, [currentRound, net, currentMatch._id]);

  return (
    <div className="absolute z-10 w-11/12 left-2 bg-yellow-logo top-1/2 transform -translate-y-1/2 flex justify-around flex-col items-center gap-y-1 py-1 rounded-lg">

      <div className="oponent-score w-full">
        <TeamScoreInput
          key={`top-${net?._id}`}
          currRound={currentRound}
          net={net ?? null}
          user={user}
          teamName={isTeamALead ? "teamBScore" : "teamAScore"}
          handlePointChange={handleScoreChange}
          teamE={opTeamE}
          wTeam={winningTeam}
          currRoundNets={currentRoundNets}
        />
      </div>

      <div className="net-info-actions w-full flex justify-around items-center h-4">
        <div className="spectate w-3/12 md:w-2/6 flex justify-center items-center">
            <Image
              width={30}
              height={30}
              onClick={navigateToScoreboard}
              src="/icons/spectate.svg"
              alt="Scorekeeper"
              className="h-4 w-4 svg-black cursor-pointer"
            />
        </div>

        <div className="net-card w-5/12 md:w-2/6 flex items-center py-1">
          <Image
            width={30}
            height={30}
            src="/icons/right-arrow.svg"
            alt="Left"
            onClick={onNavigateRight}
            className="block landscape:hidden sm:hidden w-4 svg-black transform scale-x-[-1] cursor-pointer"
          />

          <div className="text-center flex-1">
            <span className="text-xs md:text-lg uppercase">
              Net {net?.num}
            </span>
            {net?.netType === ETieBreaker.TIE_BREAKER_NET && (
              <p>Worth 2 points</p>
            )}
          </div>

          <Image
            width={30}
            height={30}
            src="/icons/right-arrow.svg"
            alt="Left"
            onClick={onNavigateLeft}
            className="rotate-180 block landscape:hidden sm:hidden w-4 svg-black transform scale-x-[-1] cursor-pointer"
          />
        </div>

        <div className="score-keeping w-3/12 md:w-2/6 flex justify-center items-center">
          <Link href={`/score-keeping/${currentMatch._id}`} className="px-2">
            <Image
              width={30}
              height={30}
              src="/icons/scorekeeper.png"
              alt="Scorekeeper"
              className="h-4 w-4 svg-black cursor-pointer"
            />
          </Link>
        </div>
      </div>

      <div className="my-score w-full">
        <TeamScoreInput
          key={`bottom-${net?._id}`}
          currRound={currentRound}
          net={net ?? null}
          user={user}
          teamName={isTeamALead ? "teamAScore" : "teamBScore"}
          handlePointChange={handleScoreChange}
          teamE={myTeamE}
          wTeam={winningTeam}
          currRoundNets={currentRoundNets}
        />
      </div>
    </div>
  );
}

export default NetPointCard;