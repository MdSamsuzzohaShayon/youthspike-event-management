"use client";

import { useReadQuery, QueryRef } from "@apollo/client/react";
import { EMessage, ETeam, IMatchExpRel } from "@/types"; // Your match type
import LocalStorageService from "@/utils/LocalStorageService";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getUserFromCookie } from "@/utils/cookie";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Loader from "../elements/Loader";
import { setMessage } from "@/redux/slices/elementSlice";
import { useSocket } from "@/lib/SocketProvider";
import { calcRoundScore } from "@/utils/scoreCalc";
import { setTeamScore } from "@/redux/slices/matchesSlice";
import MatchAuthenticatedView from "./MatchAuthenticatedView";
import useMatchSocket from "@/hooks/match/useMatchSocket";
import useNetMaps from "@/hooks/score-keeping/useNetMaps";

interface IMatchMainProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
}

export function MatchMain({ queryRef }: IMatchMainProps) {
  // Context and Redux
  const { data, error } = useReadQuery(queryRef);

  if (!data?.getMatch?.data) {
    const err = new Error(
      "Invalid Match ID detected. No match data was found for the provided ID. " +
        "Please return to the match list and select a valid match to continue."
    );
    err.name = "MatchDataNotFoundError";
    throw err;
  }

  const dispatch = useAppDispatch();
  const socket = useSocket();

  // Selectors
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  const { current: currRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const {
    currentRoundNets: currRoundNets,
    nets: allNets,
    currNetNum,
  } = useAppSelector((state) => state.nets);
  const {
    serverReceiverPlays,
    serverReceiversOnNet,
    currentServerReceiver: currServerReceiver,
  } = useAppSelector((state) => state.serverReceiverOnNets);
  const {
    myPlayers,
    opPlayers,
    myTeamE,
    verifyLineup,
    match: currMatch,
    teamATotalScore,
    teamBTotalScore,
  } = useAppSelector((state) => state.matches);

  const netByNum = useNetMaps(currRoundNets);

  useMatchSocket({
    currNetNum,
    netByNum,
    socket,
    match: currMatch,
    teamA: teamA || null,
    teamB: teamB || null,
    allNets,
    currRound,
    currRoundNets,
    roundList,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver,
  });

  const audioPlayEl = useRef<HTMLButtonElement>(null);

  // Memoize the match data to prevent unnecessary re-renders
  const match = data?.getMatch?.data;

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

  return (
    <MatchAuthenticatedView
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
}

export default MatchMain;
