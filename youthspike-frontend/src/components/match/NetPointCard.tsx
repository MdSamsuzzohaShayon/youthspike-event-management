import React, { useEffect, useMemo, useState } from "react";
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
import { fsToggle } from "@/utils/helper";
import { screen } from "@/utils/constant";

import TeamScoreInput from "../team/TeamScoreInput";

interface INetPointCardProps {
  net?: INetRelatives | null;
  onNavigateRight: () => void;
  onNavigateLeft: () => void;
  screenWidth: number;
  currentRoom: IRoom | null;
  roundList: IRoundRelatives[];
  currentMatch: IMatchRelatives;
}

/**
 * Update a specific net score inside a list
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
 * Calculate total round scores
 */
const calculateRoundScores = (nets: INetRelatives[]) => {
  let teamATotalScore: number | null = 0;
  let teamBTotalScore: number | null = 0;

  for (const net of nets) {
    if (net.teamAScore != null && net.teamBScore != null) {
      teamATotalScore! += net.teamAScore;
      teamBTotalScore! += net.teamBScore;
    } else {
      return { teamATotalScore: null, teamBTotalScore: null };
    }
  }

  return { teamATotalScore, teamBTotalScore };
};

/**
 * Determine winning team
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
  screenWidth,
  currentRoom,
  roundList,
  currentMatch,
}: INetPointCardProps) {
  const user = useUser();
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [winningTeam, setWinningTeam] = useState<ETeam | null>(null);

  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const { nets, currentRoundNets } = useAppSelector((state) => state.nets);
  const { myTeamE, opTeamE } = useAppSelector((state) => state.matches);
  const teamA = useAppSelector((state) => state.teams.teamA);

  /**
   * Handle score change
   */
  const handleScoreChange = (
    event: React.SyntheticEvent<HTMLInputElement>,
    netId: string | null,
    teamKey: "teamAScore" | "teamBScore"
  ) => {
    event.preventDefault();
    if (!netId) return;

    const value = event.currentTarget.value.trim();
    if (!value) return;

    const parsedScore = Number(value);
    if (isNaN(parsedScore)) return;

    const updatedFields: Partial<INetRelatives> = {
      [teamKey]: parsedScore,
      [teamKey === "teamAScore" ? "teamBScore" : "teamAScore"]:
        net?.[teamKey === "teamAScore" ? "teamBScore" : "teamAScore"] ?? null,
    };

    const updatedCurrentRoundNets = updateNetScores(
      currentRoundNets,
      netId,
      updatedFields
    );

    const updatedAllNets = updateNetScores(nets, netId, updatedFields);

    dispatch(setCurrentRoundNets(updatedCurrentRoundNets));
    dispatch(setNets(updatedAllNets));

    const { teamATotalScore, teamBTotalScore } =
      calculateRoundScores(updatedCurrentRoundNets);

    const updatedRound: IRoundRelatives = {
      ...currentRound,
      teamAScore: teamATotalScore,
      teamBScore: teamBTotalScore,
      completed: teamATotalScore != null && teamBTotalScore != null,
    } as IRoundRelatives;

    dispatch(setCurrentRound(updatedRound));

    const updatedRoundList = roundList.map((round) =>
      round._id === currentRound?._id ? updatedRound : round
    );

    dispatch(setRoundList(updatedRoundList));

    const updatedNet =
      updatedCurrentRoundNets.find((n) => n._id === netId) ?? null;

    new EmitEvents(socket, dispatch).updatePoints({
      currRoom: currentRoom,
      currRound: currentRound,
      currNet: updatedNet,
      myTeamE,
    });
  };

  /**
   * Navigate to scoreboard
   */
  const navigateToScoreboard = () => {
    if (!currentRound || !net) return;

    LocalStorageService.setMatch(
      currentMatch._id,
      currentRound._id,
      net._id
    );

    window.location.assign(
      `/matches/${currentMatch._id}/scoreboard?view=${EView.NET}`
    );
  };

  /**
   * Determine winning team
   */
  useEffect(() => {
    setWinningTeam(getWinningTeam(net));
  }, [net]);

  /**
   * Check if user is captain or co-captain
   */
  const isTeamALead = useMemo(() => {
    return (
      user.info?.captainplayer === teamA?.captain?._id ||
      user.info?.cocaptainplayer === teamA?.cocaptain?._id
    );
  }, [user.info, teamA]);

  return (
    <div className="absolute z-10 w-11/12 left-2 bg-yellow-logo top-1/2 transform -translate-y-1/2 flex justify-around items-center gap-x-2">
      
      {/* Spectate Button */}
      <div className="px-2">
        <Image
          width={30}
          height={30}
          onClick={navigateToScoreboard}
          src="/icons/spectate.svg"
          alt="Scorekeeper"
          className="w-6 md:w-6 svg-black"
        />
      </div>

      <div className="flex flex-col items-center p-1 rounded-lg">
        
        {/* Top Score */}
        <TeamScoreInput
          key={`top-${net?._id}`}
          currRound={currentRound}
          net={net ?? null}
          user={user}
          teamName={isTeamALead ? "teamBScore" : "teamAScore"}
          screenWidth={screenWidth}
          handlePointChange={handleScoreChange}
          teamE={opTeamE}
          wTeam={winningTeam}
          currRoundNets={currentRoundNets}
        />

        {/* Net Info */}
        <div className="net-card flex items-center w-full py-1">
          {screenWidth <= screen.xs && (
            <Image
              width={30}
              height={30}
              src="/icons/right-arrow.svg"
              alt="Right"
              onClick={onNavigateRight}
              className="w-4 svg-black transform scale-x-[-1]"
            />
          )}

          <div className="text-center flex-1">
            <h3 style={fsToggle(screenWidth)} className="uppercase">
              Net {net?.num}
            </h3>
            {net?.netType === ETieBreaker.TIE_BREAKER_NET && (
              <p>Worth 2 points</p>
            )}
          </div>

          {screenWidth <= screen.xs && (
            <Image
              width={30}
              height={30}
              src="/icons/right-arrow.svg"
              alt="Left"
              onClick={onNavigateLeft}
              className="w-4 svg-black"
            />
          )}
        </div>

        {/* Bottom Score */}
        <TeamScoreInput
          key={`bottom-${net?._id}`}
          currRound={currentRound}
          net={net ?? null}
          user={user}
          teamName={isTeamALead ? "teamAScore" : "teamBScore"}
          screenWidth={screenWidth}
          handlePointChange={handleScoreChange}
          teamE={myTeamE}
          wTeam={winningTeam}
          currRoundNets={currentRoundNets}
        />
      </div>

      {/* Scorekeeper Link */}
      <Link href={`/score-keeping/${currentMatch._id}`} className="px-2">
        <Image
          width={30}
          height={30}
          src="/icons/scorekeeper.png"
          alt="Scorekeeper"
          className="w-6 md:w-6 svg-black"
        />
      </Link>
    </div>
  );
}

export default NetPointCard;