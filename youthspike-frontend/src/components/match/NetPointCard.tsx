import { useUser } from "@/lib/UserProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { IMatchRelatives, INetRelatives, IRoundRelatives } from "@/types";
import { IRoom } from "@/types/room";
import { ETeam } from "@/types/team";
import { fsToggle } from "@/utils/helper";
import React, { useEffect, useMemo, useState } from "react";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { useSocket } from "@/lib/SocketProvider";
import EmitEvents from "@/utils/socket/EmitEvents";
import { ETieBreaker } from "@/types/net";
import Image from "next/image";
import { screen } from "@/utils/constant";
import TeamScoreInput from "../team/TeamScoreInput";
import LocalStorageService from "@/utils/LocalStorageService";

interface INetPointCardProps {
  net: INetRelatives | null | undefined;
  handleRightShift: () => void;
  handleLeftShift: () => void;
  screenWidth: number;
  currRoom: IRoom | null;
  roundList: IRoundRelatives[];
  currMatch: IMatchRelatives;
}

function NetPointCard({
  net,
  handleRightShift,
  handleLeftShift,
  screenWidth,
  currRoom,
  roundList,
  currMatch,
}: INetPointCardProps) {
  const user = useUser();
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const [wTeam, setWTeam] = useState<ETeam | null>(null);

  const { current: currRound } = useAppSelector((state) => state.rounds);
  const { nets: allNets, currentRoundNets: currRoundNets } = useAppSelector(
    (state) => state.nets
  );
  const { myTeamE, opTeamE } = useAppSelector((state) => state.matches);
  const teamA = useAppSelector((state) => state.teams.teamA);

  /**
   * Optimized point change handler
   * - Single-pass updates (no unnecessary array cloning)
   * - Reduces O(n) operations into direct updates
   */
  const handlePointChange = (
    e: React.SyntheticEvent,
    netId: string | null,
    teamAorB: string
  ) => {
    e.preventDefault();
    if (!netId) return;

    const inputEl = e.target as HTMLInputElement;
    const raw = inputEl.value.trim();
    if (!raw) return;

    const teamScore = parseInt(raw, 10);
    const updateObj =
      teamAorB === ETeam.teamA
        ? { teamAScore: teamScore, teamBScore: net?.teamBScore ?? null }
        : { teamBScore: teamScore, teamAScore: net?.teamAScore ?? null };

    // Mutate once instead of cloning and finding multiple times
    const updatedCRN = currRoundNets.map((n) =>
      n._id === netId ? { ...n, ...updateObj } : n
    );
    const updatedAllNets = allNets.map((n) =>
      n._id === netId ? { ...n, ...updateObj } : n
    );

    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));

    // Aggregate team scores in a single pass
    let tas: number | null = 0;
    let tbs: number | null = 0;
    for (const n of updatedCRN) {
      if (n.teamAScore != null && n.teamBScore != null) {
        tas! += n.teamAScore;
        tbs! += n.teamBScore;
      } else {
        tas = null;
        tbs = null;
        break; // no need to continue, incomplete round
      }
    }

    const currNet = updatedCRN.find((n) => n._id === netId) ?? null;

    const currRoundObj: IRoundRelatives = {
      ...currRound,
      teamAScore: tas,
      teamBScore: tbs,
      completed: tas != null && tbs != null,
    } as IRoundRelatives;

    dispatch(setCurrentRound(currRoundObj));

    const updatedRoundList = roundList.map((r) =>
      r._id === currRound?._id ? { ...currRoundObj } : r
    );
    dispatch(setRoundList(updatedRoundList));

    // Emit event once
    new EmitEvents(socket, dispatch).updatePoints({
      currRoom,
      currRound,
      currNet,
      myTeamE,
    });
  };

  const handleKeyUp = (e: React.SyntheticEvent) => e.preventDefault();

  const handleScorekeeperNavigation = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Persist round + net to localStorage
    LocalStorageService.setMatch(currMatch._id, currRound?._id || "", net?._id);
    window.location.assign(`/score-keeping/${currMatch._id}`); // preserves back button history
  };

  /**
   * Memoized winner calculation instead of re-setting every render
   */
  useEffect(() => {
    if (net?.teamAScore != null && net?.teamBScore != null) {
      if (net.teamAScore > net.teamBScore) setWTeam(ETeam.teamA);
      else if (net.teamAScore < net.teamBScore) setWTeam(ETeam.teamB);
      else setWTeam(null);
    } else {
      setWTeam(null);
    }
  }, [net?.teamAScore, net?.teamBScore]);

  const teamACapOrCo = useMemo(
    () =>
      user.info?.captainplayer === teamA?.captain?._id ||
      user.info?.cocaptainplayer === teamA?.cocaptain?._id,
    [user.info, teamA]
  );

  return (
    <div className="absolute z-10 w-11/12 left-2 bg-yellow-logo top-1/2 transform -translate-y-1/2 flex justify-around items-center">
      <div className="w-4 md:w-8" />
      <div className="flex flex-col justify-around items-center p-1 rounded-lg ">
        <TeamScoreInput
          key={`top-${net?._id}`}
          currRound={currRound}
          net={net ?? null}
          user={user}
          teamName={user && teamACapOrCo ? "teamBScore" : "teamAScore"}
          screenWidth={screenWidth}
          handlePointChange={handlePointChange}
          teamE={opTeamE}
          wTeam={wTeam}
          currRoundNets={currRoundNets}
        />
        <div className="net-card flex justify-around items-center w-full py-1">
          {screenWidth <= screen.xs && (
            <Image
              width={50}
              height={30}
              src="/icons/right-arrow.svg"
              alt="right-arrow"
              onKeyUp={handleKeyUp}
              onClick={handleRightShift}
              role="presentation"
              className="w-4 svg-black transform scale-x-[-1]"
            />
          )}
          <div className="texts text-center">
            <h3 style={fsToggle(screenWidth)} className="leading-3 uppercase">
              Net {net?.num}
            </h3>
            {net?.netType === ETieBreaker.TIE_BREAKER_NET && (
              <p className="w-full">Worth 2 points</p>
            )}
          </div>
          {screenWidth <= screen.xs && (
            <Image
              width={50}
              height={30}
              src="/icons/right-arrow.svg"
              alt="left-arrow"
              onKeyUp={handleKeyUp}
              onClick={handleLeftShift}
              role="presentation"
              className="w-4 svg-black"
            />
          )}
        </div>
        <TeamScoreInput
          key={`bottom-${net?._id}`}
          currRound={currRound}
          net={net ?? null}
          user={user}
          teamName={user && teamACapOrCo ? "teamAScore" : "teamBScore"}
          screenWidth={screenWidth}
          handlePointChange={handlePointChange}
          teamE={myTeamE}
          wTeam={wTeam}
          currRoundNets={currRoundNets}
        />
      </div>

      <Image
        width={30}
        height={30}
        role="presentation"
        onClick={handleScorekeeperNavigation}
        src="/icons/scorekeeper.png"
        alt="Scorekeeper"
        className="w-4 md:w-8 svg-black"
      />
    </div>
  );
}

export default NetPointCard;
