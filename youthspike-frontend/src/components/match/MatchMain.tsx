"use client";

// Reference - https://github.com/MdSamsuzzohaShayon/youthspike-event-management/blob/f612e8d69aba785095e59bc97dc6dacb6de6a004/youthspike-frontend/src/app/matches/%5BmatchId%5D/page.tsx


import { useReadQuery } from "@apollo/client";
import type { QueryRef } from "@apollo/client";
import { EPlayerStatus, ETeam, IMatchExpRel, IOvertimeData, IRoom, IRoomNets, ITeiBreakerAction, IUpdateScoreResponse, UserRole } from "@/types"; // Your match type
import LocalStorageService from "@/utils/LocalStorageService";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUserFromCookie } from "@/utils/cookie";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Loader from "../elements/Loader";
import { setActErr, setScreenSize } from "@/redux/slices/elementSlice";
import useResizeObserver from "@/hooks/useResizeObserver";
import { useUser } from "@/lib/UserProvider";
import { useSocket } from "@/lib/SocketProvider";
import TeamPlayers from "../player/TeamPlayers";
import NotTieBreaker from "../ActionBoxes/NotTieBreaker";
import VerifyLineup from "../ActionBoxes/VerifyLineup";
import NetScoreOfRound from "./NetScoreOfRound";
import LineupStrategy from "./LineupStrategy";
import RoundRunner from "./RoundRunner";
import SelectTeam from "./SelectTeam";
import Image from "next/image";
import { APP_NAME } from "@/utils/keys";
import { CldImage } from "next-cloudinary";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import { calcRoundScore } from "@/utils/scoreCalc";
import { setTeamScore } from "@/redux/slices/matchesSlice";

interface IMatchMainProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
}

export function MatchMain({ queryRef }: IMatchMainProps) {
  const audioPlayEl = useRef<HTMLButtonElement>(null);
  const mainEl = useResizeObserver(
    useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
      dispatch(setScreenSize(entry.contentRect.width));
    }, [])
  );

  // Context and Redux
  const { data, error } = useReadQuery(queryRef);
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Selectors
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const {
    currentRoundNets: currRoundNets,
    nets: allNets,
    notTieBreakerNetId,
  } = useAppSelector((state) => state.nets);
  const {
    myPlayers,
    opPlayers,
    myTeamE,
    verifyLineup,
    match: currMatch,
    teamATotalScore,
    teamBTotalScore,
  } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);

  // Local State
  const [selectTeam, setSelectTeam] = useState<boolean>(false);

  // Memoize the match data to prevent unnecessary re-renders
  const match = useMemo(() => data?.getMatch?.data, [data]);
  const myTeam = useMemo(
    () => (myTeamE === ETeam.teamA ? teamA : teamB),
    [myTeamE, teamA, teamB]
  );
  const opTeam = useMemo(
    () => (myTeamE === ETeam.teamA ? teamB : teamA),
    [myTeamE, teamA, teamB]
  );
  const myS = useMemo(
    () => (myTeamE === ETeam.teamA ? teamATotalScore : teamBTotalScore),
    [myTeamE, teamATotalScore, teamBTotalScore]
  );
  const opS = useMemo(
    () => (myTeamE === ETeam.teamA ? teamBTotalScore : teamATotalScore),
    [myTeamE, teamATotalScore, teamBTotalScore]
  );
  const activeMyPlayers = useMemo(
    () => myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [myPlayers]
  );
  const activeOpPlayers = useMemo(
    () => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [opPlayers]
  );
  const showSponsors = useMemo(
    () => eventSponsors.length > 0 && (!user || !user.token),
    [eventSponsors.length, user]
  );
  const captainAccess: boolean = useMemo(() => {
    if (
      user.info?.role !== UserRole.captain &&
      user.info?.role !== UserRole.co_captain
    ) {
      return true;
    }
    if (user?.info?.captainplayer) {
      if (
        user.info.captainplayer === teamA?.captain?._id ||
        user.info.captainplayer === teamB?.captain?._id
      ) {
        return true;
      }
    }
    if (user?.info?.cocaptainplayer) {
      if (
        user.info.cocaptainplayer === teamA?.cocaptain?._id ||
        user.info.cocaptainplayer === teamB?.cocaptain?._id
      ) {
        return true;
      }
    }
    return false;
  }, [user, teamA, teamB]);

  // Event handlers
  const handlePlayAudio = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (LocalStorageService.hasTimePassed(5)) {
      const audio = new Audio("/audio/notification.mp3");
      audio.play().catch(console.error);
      LocalStorageService.setMusicPlayedTime();
    }
  }, []);

  // Organize data only when necessary
  const organizeData = useCallback(async () => {
    if (!match?.event?._id)
      return dispatch(
        setActErr({ success: false, message: "Can not find any event" })
      );

    const userDetail = getUserFromCookie();

    await organizeFetchedData({
      matchData: match,
      token: userDetail.token,
      userInfo: userDetail.info,
      matchId: match._id,
      dispatch,
    });
  }, [match, dispatch]);


  // Organize fetched data
  useEffect(() => {
    if(match){
      organizeData();
    }
    if (match?.event?._id) {
      LocalStorageService.setEvent(match.event._id);
    }
  }, [match, organizeData]);


  // Handle Socket events
  useEffect(() => {
    if (!socket || roundList.length === 0) {
      console.warn('No socket or round list available');
      return;
    }

    const userDetail = getUserFromCookie();
    const emitEvents = new EmitEvents(socket, dispatch);
    const socketEventListener = new SocketEventListener(socket, dispatch, audioPlayEl);

    emitEvents.joinRoom({
      user: userDetail,
      teamA,
      teamB,
      currRound: currentRound,
      matchId: match._id,
    });

    const listeners = {
      'extend-overtime-response-all': (data: IOvertimeData) => socketEventListener.updateExtendOvertime({ data, dispatch, match: currMatch }),
      'join-room-response-all': (data: IRoom) => socketEventListener.handleJoinRoom(data, dispatch),
      'check-in-response-to-all': (data: IRoom) => socketEventListener.handleCheckInResponse({ data, dispatch, roundList, currentRound }),
      'submit-lineup-response-all': (data: IRoomNets) => socketEventListener.handleLineupResponse({ data, dispatch, currRoundNets, allNets, roundList, currentRound }),
      'update-points-response-all': (data: IUpdateScoreResponse) => socketEventListener.handleUpdatePoints({ data, dispatch, currRoundNets, allNets, currentRound, roundList, match: currMatch }),
      'tie-breaker-response-all': (data: ITeiBreakerAction) => socketEventListener.handleUpdateNet({ data, dispatch, allNets, currRoundNets, roundList, match: currMatch }),
      'error-from-server': (error: string) => socketEventListener.handleError(error, dispatch),
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(listeners).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, teamA, teamB, currentRound, roundList, currRoundNets, dispatch, currMatch, allNets]);

  // User interaction at the beginning
  useEffect(() => {
    mainEl.current?.click();
  }, [mainEl]);

  // Calculate points
  useEffect(() => {
    let teamATS = 0,
      teamAPMS = 0,
      teamBTS = 0,
      teamBPMS = 0;

    roundList.forEach((round) => {
      const netList = allNets.filter((n) => n.round === round._id);
      const { score: tas, plusMinusScore: tapms } = calcRoundScore(netList, round, ETeam.teamA);
      teamATS += tas;
      teamAPMS += tapms;

      const { score: tbs, plusMinusScore: tbpms } = calcRoundScore(netList, round, ETeam.teamB);
      teamBTS += tbs;
      teamBPMS += tbpms;
    });

    dispatch(
      setTeamScore({
        teamATotalScore: teamATS,
        teamBTotalScore: teamBTS,
        teamBPMScore: teamBPMS,
        teamAPMScore: teamAPMS,
      }),
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
    <div className="relative bg-white text-black-logo" ref={mainEl}>
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
            myS < opS && currMatch.completed
              ? "bg-green-500 text-white"
              : "text-gray-100"
          }`}
        >
          <h1 className="op-team-name text-2xl font-bold uppercase container px-4 mx-auto">
            {opTeam?.name}
          </h1>
        </div>
        <TeamPlayers
          teamPlayers={activeOpPlayers}
          roundList={roundList}
          screenWidth={screenWidth}
          onTop
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
              currRound={currentRound}
              socket={socket}
            />
          </div>
        ) : (
          <div className="verify-strategy-main-points">
            {verifyLineup ? (
              <VerifyLineup />
            ) : (
              <>
                {currentRound && (
                  <div className="net-score">
                    <NetScoreOfRound currRoundId={currentRound._id} />
                  </div>
                )}

                {user?.info && (
                  <div className="line-up-strategy w-full">
                    <LineupStrategy
                      myTeamE={myTeamE}
                      currRound={currentRound}
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
                  [
                    UserRole.director,
                    UserRole.admin,
                    UserRole.captain,
                    UserRole.co_captain,
                  ].includes(user.info.role) &&
                  captainAccess && (
                    <div className="my-round-runner w-full">
                      <RoundRunner
                        currentRoom={currRoom}
                        currentRound={currentRound}
                        myTeamE={myTeamE}
                        roundList={roundList}
                        teamA={teamA}
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
          teamPlayers={activeMyPlayers}
          screenWidth={screenWidth}
        />

        <div className="team-name-selection">
          {selectTeam && teamA && teamB ? (
            <div className="select-team-wrapper px-4">
              <SelectTeam
                teamA={teamA}
                teamB={teamB}
                setSelectTeam={setSelectTeam}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="container px-4 mx-auto flex justify-between">
                <h1 className="my-team-name text-xl font-bold uppercase">
                  {myTeam?.name}
                </h1>
                {(user.info?.role === UserRole.director ||
                  user.info?.role === UserRole.admin) && (
                  <button
                    className="right-4 z-20"
                    aria-label="select-team"
                    type="button"
                    onClick={() => setSelectTeam(true)}
                  >
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
          )}
        </div>
      </div>

      {showSponsors && (
        <div className="sponsors w-full py-4 mx-auto bg-black-logo text-white rounded-lg shadow-md">
          <div className="container px-4 mx-auto">
            <h2 className="text-lg font-semibold">Sponsors</h2>
            <div className="flex items-center justify-between md:justify-start flex-wrap w-full gap-4">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image
                    key={spon._id}
                    src={`/${spon.logo}`}
                    width={40}
                    height={40}
                    alt="default-logo"
                    className="w-20"
                  />
                ) : (
                  <CldImage
                    alt={spon.company}
                    width="100"
                    height="100"
                    className="w-20"
                    src={spon.logo}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchMain;
