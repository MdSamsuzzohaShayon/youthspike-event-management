"use client";

// Reference - https://github.com/MdSamsuzzohaShayon/youthspike-event-management/blob/f612e8d69aba785095e59bc97dc6dacb6de6a004/youthspike-frontend/src/app/matches/%5BmatchId%5D/page.tsx

import { useReadQuery } from "@apollo/client";
import type { QueryRef } from "@apollo/client";
import {
  EMessage,
  EPlayerStatus,
  ETeam,
  IMatchExpRel,
  IOvertimeData,
  IRoom,
  IRoomNets,
  ITeiBreakerAction,
  IUpdateScoreResponse,
} from "@/types"; // Your match type
import LocalStorageService from "@/utils/LocalStorageService";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getUserFromCookie } from "@/utils/cookie";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Loader from "../elements/Loader";
import { setMessage } from "@/redux/slices/elementSlice";
import { useUser } from "@/lib/UserProvider";
import { useSocket } from "@/lib/SocketProvider";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import { calcRoundScore } from "@/utils/scoreCalc";
import { setTeamScore } from "@/redux/slices/matchesSlice";
import MatchAuthenticatedView from "./MatchAuthenticatedView";
import MatchPublicView from "./MatchPublicView";

interface IMatchMainProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
}

export function MatchMain({ queryRef }: IMatchMainProps) {
  // Context and Redux
  const { data, error } = useReadQuery(queryRef);
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Selectors
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  const { current: currentRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector(
    (state) => state.nets
  );
  const {
    myPlayers,
    opPlayers,
    myTeamE,
    verifyLineup,
    match: currMatch,
    teamATotalScore,
    teamBTotalScore,
  } = useAppSelector((state) => state.matches);

  const audioPlayEl = useRef<HTMLButtonElement>(null);

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

  const activeOpPlayers = useMemo(
    () => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [opPlayers]
  );

  // Organize data only when necessary
  const organizeData = useCallback(async () => {
    if (!match?.event?._id)
      dispatch(
        setMessage({ type: EMessage.ERROR, message: "Can not find any event" })
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
    if (match) {
      organizeData();
    }
    if (match?.event?._id) {
      LocalStorageService.setEvent(match.event._id);
    }
  }, [match, organizeData]);

  // Handle Socket events
  useEffect(() => {
    if (!socket || roundList.length === 0) {
      console.warn("No socket or round list available");
      return;
    }

    const userDetail = getUserFromCookie();
    const emitEvents = new EmitEvents(socket, dispatch);
    const socketEventListener = new SocketEventListener(
      socket,
      dispatch,
      audioPlayEl
    );

    emitEvents.joinRoom({
      user: userDetail,
      teamA,
      teamB,
      currRound: currentRound,
      matchId: match._id,
    });

    const listeners = {
      "extend-overtime-response-all": (data: IOvertimeData) =>
        socketEventListener.updateExtendOvertime({
          data,
          dispatch,
          match: currMatch,
        }),
      "join-room-response-all": (data: IRoom) =>
        socketEventListener.handleJoinRoom(data, dispatch),
      "check-in-response-to-all": (data: IRoom) =>
        socketEventListener.handleCheckInResponse({
          data,
          dispatch,
          roundList,
          currentRound,
        }),
      "submit-lineup-response-all": (data: IRoomNets) =>
        socketEventListener.handleLineupResponse({
          data,
          dispatch,
          currRoundNets,
          allNets,
          roundList,
          currentRound,
        }),
      "update-points-response-all": (data: IUpdateScoreResponse) =>
        socketEventListener.handleUpdatePoints({
          data,
          dispatch,
          currRoundNets,
          allNets,
          currentRound,
          roundList,
          match: currMatch,
        }),
      "tie-breaker-response-all": (data: ITeiBreakerAction) =>
        socketEventListener.handleUpdateNet({
          data,
          dispatch,
          allNets,
          currRoundNets,
          roundList,
          match: currMatch,
        }),
      "error-from-server": (error: string) =>
        socketEventListener.handleError(error, dispatch),
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(listeners).forEach((event) => {
        socket.off(event);
      });
    };
  }, [
    socket,
    teamA,
    teamB,
    currentRound,
    roundList,
    currRoundNets,
    dispatch,
    currMatch,
    allNets,
  ]);

  // Calculate points
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

  if (user && user?.token) {
    return (
      <MatchAuthenticatedView
        activeOpPlayers={activeOpPlayers}
        currMatch={currMatch}
        myPlayers={myPlayers}
        myS={myS}
        opS={opS}
        myTeam={myTeam || null}
        opTeam={opTeam || null}
        myTeamE={myTeamE}
        verifyLineup={verifyLineup}
        opPlayers={opPlayers}
        teamA={teamA || null}
        teamB={teamB || null}
        audioPlayEl={audioPlayEl}
      />
    );
  } else {
    return (
      <MatchPublicView
        currRound={currentRound}
        currRoundNets={currRoundNets}
        nets={allNets}
        roundList={roundList}
        teamA={teamA || null}
        teamB={teamB || null}
      />
    );
  }
}

export default MatchMain;
