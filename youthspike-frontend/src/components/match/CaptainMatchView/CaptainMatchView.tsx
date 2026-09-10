import useResizeObserver from "@/hooks/useResizeObserver";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import LocalStorageService from "@/utils/LocalStorageService";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  EActionProcess,
  EPlayerStatus,
  ETeam,
  IMatchRelatives,
  IPlayer,
  ITeam,
} from "@/types";
import { useUser } from "@/lib/UserProvider";
import randomAssign from "@/utils/assignStrategies/randomAssign";
import EmitEvents from "@/utils/socket/EmitEvents";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { setDisabledPlayerIds } from "@/redux/slices/matchesSlice";
import autoAssignClock from "@/utils/assignStrategies/autoAssignClock";
import { formatClock } from "@/utils/datetime";
import { useLdoId } from "@/lib/LdoProvider";
import { useSocket } from "@/lib/SocketProvider";
import { canAccessRoundRunner, excludeMovedPlayers, filterActivePlayers, getMovedPlayerIdSet, getOpponentTeamE, getRoundTimeoutEndMs, getTeamRosterHref, isAdminOrDirector, ROUND_RUNNER_ROLES } from "@/utils/match/captainViewHelpers";
import TeamRosterHeader from "./TeamRosterHeader";
import TeamPlayers from "@/components/player/TeamPlayers";
import NotTieBreaker from "@/components/ActionBoxes/NotTieBreaker";
import NetScoreOfRound from "./NetScoreOfRound";
import LineupStrategy from "../LineupStrategy";
import RoundRunner from "../RoundRunner";
import SelectTeamDialog from "../SelectTeamDialog";
import MatchSponsors from "./MatchSponsors";
import VerifyLineup from "@/components/verify-lineup/VerifyLineup";

interface ICaptainMatchViewProps {
  currMatch: IMatchRelatives;
  myTeam: ITeam | null;
  opTeam: ITeam | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  verifyLineup: boolean;
  myTeamE: ETeam;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  audioPlayEl: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Authenticated match view: shows both rosters, the live round state
 * (lineup strategy, round runner controls, net scores, and the pick
 * timeout countdown), and sponsor branding for unauthenticated guests.
 */
function CaptainMatchView({
  currMatch,
  myTeam,
  opTeam,
  teamA,
  teamB,
  verifyLineup,
  myTeamE,
  myPlayers,
  opPlayers,
  audioPlayEl,
}: ICaptainMatchViewProps) {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const user = useUser();
  const { ldoIdUrl } = useLdoId();

  // Redux state
  const { matchScore } = useAppSelector((state) => state.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector(
    (state) => state.playerRanking
  );
  const {
    currentRoundNets: currRoundNets,
    nets: allNets,
    notTieBreakerNetId,
  } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const { current: currRoom } = useAppSelector((state) => state.rooms);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);

  // Local state
  const [selectTeam, setSelectTeam] = useState<boolean>(false);

  // Refs
  const clockRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);
  const lastTextRef = useRef<string>("");
  const mainRef = useRef<HTMLDivElement | null>(null);

  const handlePlayAudio = useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!LocalStorageService.hasTimePassed(5)) return;
    try {
      const audio = new Audio("/audio/notification.mp3");
      audio.play().catch((error) => {
        console.error("Failed to play notification audio:", error);
      });
      LocalStorageService.setMusicPlayedTime();
    } catch (error) {
      console.error("Failed to initialize notification audio:", error);
    }
  }, []);

  const showSponsors = useMemo(
    () => eventSponsors.length > 0 && (!user || !user.token),
    [eventSponsors.length, user]
  );

  const canManageRound = useMemo(
    () => canAccessRoundRunner(user, teamA, teamB),
    [user, teamA, teamB]
  );

  const myActivePlayers = useMemo(
    () => filterActivePlayers(myPlayers),
    [myPlayers]
  );
  const opActivePlayers = useMemo(
    () => filterActivePlayers(opPlayers),
    [opPlayers]
  );

  const handleRoundTimeout = useCallback(() => {
    if (!myPlayers || myPlayers.length === 0) return;
    try {
      const matchUp = currRound?.firstPlacing !== myTeamE;
      const movedPlayerIds = getMovedPlayerIdSet(teamA, teamB);
      const filteredOpPlayers = excludeMovedPlayers(opPlayers, movedPlayerIds);
      const filteredMyPlayers = excludeMovedPlayers(myPlayers, movedPlayerIds);

      const { updatedAllNets, updatedCurrRoundNets, selectedPlayerIds } =
        randomAssign({
          currMatch,
          matchUp,
          allNets,
          currRoundNets,
          myPlayers: filteredMyPlayers,
          opPlayers: filteredOpPlayers,
          roundList,
          currRound,
          myTeam: myTeamE,
          teamAPlayerRanking,
          teamBPlayerRanking,
        });

      dispatch(setCurrentRoundNets(updatedCurrRoundNets));
      dispatch(setNets(updatedAllNets));
      dispatch(setDisabledPlayerIds(selectedPlayerIds));

      const emitEvents = new EmitEvents(socket, dispatch);
      const activeMyPlayerIds = myPlayers
        .filter((player) => player.status === EPlayerStatus.ACTIVE)
        .map((player) => player._id);

      emitEvents.submitLineup({
        eventId: currMatch.event || "",
        currRoom,
        currRound,
        currRoundNets: updatedCurrRoundNets,
        dispatch,
        myPlayerIds: activeMyPlayerIds,
        myTeamE,
        roundList,
        socket,
        user,
        teamA,
        teamB,
        match: currMatch,
      });

      LocalStorageService.removeAssignClock(currRound?._id || "");
      console.log("Automatically submitted random assignment");
    } catch (error) {
      console.error("Failed to auto-submit lineup after round timeout:", error);
    }
  }, [
    currMatch,
    currRound,
    myTeamE,
    teamA,
    teamB,
    socket,
    dispatch,
    teamAPlayerRanking,
    teamBPlayerRanking,
    myPlayers,
    opPlayers,
    allNets,
    currRoundNets,
    roundList,
    currRoom,
    user,
  ]);

  // Start (or skip, if one is already running for this team) the round's
  // auto-assign clock whenever the round or match changes.
  useEffect(() => {
    if (!currRound) return;
    try {
      const existingTimer = LocalStorageService.getAssignedClock(
        currRound._id,
        myTeam?._id || ""
      );
      if (existingTimer && existingTimer.team !== myTeam?._id) {
        console.warn(
          "A round timer is already running for this round; skipping re-initialization."
        );
        return;
      }
      autoAssignClock(currRound, currMatch, myTeamE);
    } catch (error) {
      console.error("Failed to initialize the round auto-assign clock:", error);
    }
  }, [currRound, currMatch, myTeam, myTeamE]);

  // Drive the visible countdown clock from the timer stored in local
  // storage, and auto-submit a lineup once it reaches zero.
  useEffect(() => {
    if (!currRound || !myTeam) return;
    const myTeamStillPickingLineup =
      (currRound.teamAProcess === EActionProcess.LINEUP &&
        myTeamE === ETeam.teamA) ||
      (currRound.teamBProcess === EActionProcess.LINEUP &&
        myTeamE === ETeam.teamB);
    if (myTeamStillPickingLineup) return;

    let timer: ReturnType<typeof LocalStorageService.getAssignedClock> | null =
      null;
    try {
      timer = LocalStorageService.getAssignedClock(currRound._id, myTeam._id);
    } catch (error) {
      console.error("Failed to read the round timer from local storage:", error);
      return;
    }
    if (!timer || timer.team !== myTeam._id) return;

    const endTimeMs = getRoundTimeoutEndMs(timer.start, Number(currMatch.timeout));
    if (endTimeMs === null) return;
    endTimeRef.current = endTimeMs;

    const updateClockDisplay = () => {
      if (!clockRef.current) return;
      const remainingMs = endTimeRef.current - Date.now();
      if (remainingMs <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clockRef.current.textContent = "00:00";
        clockRef.current.classList.add("hidden");
        setTimeout(handleRoundTimeout, 0);
        return;
      }
      const formattedTime = formatClock(remainingMs);
      clockRef.current.classList.remove("hidden");
      if (formattedTime !== lastTextRef.current) {
        clockRef.current.textContent = formattedTime;
        lastTextRef.current = formattedTime;
      }
    };

    updateClockDisplay();
    intervalRef.current = setInterval(updateClockDisplay, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Deliberately keyed off round/team ids (not the whole objects) so this
    // effect doesn't restart on every unrelated re-render. `handleRoundTimeout`
    // is included so a roster change (which changes its identity, since it
    // depends on myPlayers/opPlayers) still restarts the countdown, matching
    // the original behavior without needing to list those arrays directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currRound?._id, myTeam?._id, myTeamE, currMatch.timeout, handleRoundTimeout]);

  // Simulate an initial user interaction so the browser allows audio
  // playback later without requiring an explicit click.
  useEffect(() => {
    mainRef.current?.click();
  }, [mainRef]);

  const myScore =
    myTeamE === ETeam.teamA ? matchScore.teamAMScore : matchScore.teamBMScore;
  const opponentScore =
    myTeamE === ETeam.teamB ? matchScore.teamAMScore : matchScore.teamBMScore;
  const isOpponentLeading = myScore < opponentScore && currMatch.completed;
  const opponentTeamE = getOpponentTeamE(myTeamE);

  const viewerIsAdminOrDirector =
    Boolean(user.token) && isAdminOrDirector(user.info?.role);
  const opponentRosterHref = getTeamRosterHref(
    opTeam?._id,
    ldoIdUrl,
    viewerIsAdminOrDirector
  );
  const myRosterHref = getTeamRosterHref(myTeam?._id, ldoIdUrl, false);

  return (
    <div className="relative bg-white text-black-logo" ref={mainRef}>
      <button
        ref={audioPlayEl}
        onClick={handlePlayAudio}
        type="button"
        className="hidden"
      >
        Button
      </button>
      <div className="op-rosters-wrapper w-full bg-black-logo text-white">
        <div
          className={`w-full bg-black-logo ${
            isOpponentLeading ? "bg-green-500 text-white" : "text-gray-100"
          }`}
        >
          <TeamRosterHeader
            teamName={opTeam?.name}
            rosterHref={opponentRosterHref}
          />
        </div>
        <TeamPlayers
          teamPlayers={opActivePlayers}
          roundList={roundList}
          onTop
          teamE={opponentTeamE}
        />
      </div>
      <div className="main-match-wrapper w-full">
        {notTieBreakerNetId ? (
          <div className="not-tie-breaker w-full bg-white text-black-logo shadow-md rounded-lg">
            <NotTieBreaker
              teamA={teamA}
              teamB={teamB}
              ntbnId={notTieBreakerNetId}
              currRoundNets={currRoundNets}
              currRound={currRound}
              socket={socket}
            />
          </div>
        ) : (
          <div className="verify-strategy-main-points">
            {verifyLineup ? (
              <VerifyLineup
            />
            ) : (
              <>
                {currRound && (
                  <div className="net-score">
                    <NetScoreOfRound />
                  </div>
                )}
                <div
                  ref={clockRef}
                  className="hidden px-2 py-1 bg-yellow-logo text-black font-mono w-full text-center"
                />
                {user?.info && (
                  <div className="line-up-strategy w-full">
                    <LineupStrategy
                      myTeamEnum={myTeamE}
                      currRound={currRound}
                      myPlayers={myPlayers}
                      opPlayers={opPlayers}
                      currRoundNets={currRoundNets}
                      allNets={allNets}
                      roundList={roundList}
                      currMatch={currMatch}
                    />
                  </div>
                )}
                {user?.info &&
                  currRoom &&
                  ROUND_RUNNER_ROLES.includes(user.info.role) &&
                  canManageRound && (
                    <div className="my-round-runner w-full">
                      <RoundRunner
                        currentRoom={currRoom}
                        currentRound={currRound}
                        myTeamE={myTeamE}
                        roundList={roundList}
                        teamA={teamA}
                        teamB={teamB}
                        currRoundNets={currRoundNets}
                      />
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
      <div className="my-roster-wrapper w-full bg-black-logo text-white">
        <TeamPlayers
          roundList={roundList}
          teamPlayers={myActivePlayers}
          teamE={myTeamE}
        />
        <TeamRosterHeader teamName={myTeam?.name} rosterHref={myRosterHref} />
        <div className="team-name-selection">
          {selectTeam && teamA && teamB && (
            <div className="select-team-wrapper px-4">
              <SelectTeamDialog
                teamA={teamA}
                teamB={teamB}
                setSelectTeam={setSelectTeam}
              />
            </div>
          )}
          <div className="w-full">
            <div className="container px-4 mx-auto flex justify-between">
              {isAdminOrDirector(user.info?.role) && (
                <button
                  className="w-full flex justify-between items-center"
                  aria-label="select-team"
                  type="button"
                  onClick={() => setSelectTeam(true)}
                >
                  <span className="uppercase">{myTeam?.name}</span>
                  <Image
                    width={24}
                    height={24}
                    src="/icons/dropdown.svg"
                    className="w-6 svg-white"
                    alt="dropdown-icon"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showSponsors && <MatchSponsors sponsors={eventSponsors} />}
    </div>
  );
}

export default CaptainMatchView;