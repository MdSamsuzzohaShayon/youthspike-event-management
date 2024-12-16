/* eslint-disable no-nested-ternary */

'use client';

/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import TeamPlayers from '@/components/player/TeamPlayers';
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';
import Loader from '@/components/elements/Loader';

// GraphQL
import { useLazyQuery } from '@apollo/client';
import { GET_MATCH_DETAIL } from '@/graphql/matches';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActErr, setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { getUserFromCookie } from '@/utils/cookie';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
// Types
import { useUser } from '@/lib/UserProvider';
import Message from '@/components/elements/Message';
import { useSocket } from '@/lib/SocketProvider';
import { isValidObjectId } from '@/utils/helper';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import { IUserContext, UserRole } from '@/types/user';
import LineupStrategy from '@/components/match/LineupStrategy';
import VerifyLineup from '@/components/ActionBoxes/VerifyLineup';
import { EPlayerStatus } from '@/types/player';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';
import { hasTimePassed, removeEvent, setEvent, setMusicPlayedTime } from '@/utils/localStorage';
import { APP_NAME } from '@/utils/keys';
import { imgW } from '@/utils/constant';
import Image from 'next/image';
import { ETeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';
import { setTeamScore } from '@/redux/slices/matchesSlice';

import './Match.css';
import SelectTeam from '@/components/match/SelectTeam';
import { imgSize } from '@/utils/styles';
import { IRoom, IRoomNets, IUpdateScoreResponse } from '@/types';
import EmitEvents from '@/utils/socket/EmitEvents';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { ITeiBreakerAction } from '@/types/room';

/**
 * Test Match
 *
 * Liverpool FC
 * Captain
 * pfn11124
 * Co-captains
 * pfn13124
 *
 *
 *
 * Aston Villa
 * Captain
 * pfn7125
 * Co-captains
 * pfn4125
 */

export function MatchPage({ params }: { params: { matchId: string } }) {
  // ===== Hooks =====
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // ===== Local State =====
  const audioPlayEl = useRef<HTMLButtonElement>(null);
  const [selectTeam, setSelectTeam] = useState<boolean>(false);

  // ===== Redux States =====
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth, actErr } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, nets: allNets, notTieBreakerNetId } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, myTeamE, verifyLineup, match: currMatch, teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);

  // ===== GraphAL =====
  const [getMatch, { data, error, loading }] = useLazyQuery(GET_MATCH_DETAIL, { variables: { matchId: params.matchId } });

  const handlePlayAudio = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const timePassed = hasTimePassed(5); // 5 seconds
    if (timePassed) {
      const audio = new Audio('/audio/notification.mp3');
      audio.play().catch((musicErr) => console.error(musicErr));
      setMusicPlayedTime();
    }
  };

  // ===== Component resize =====
  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  const fetchData = async (userDetail: IUserContext) => {
    const result = await getMatch({ variables: { matchId: params.matchId } });

    if (result?.data?.getMatch?.data) {
      if (result.data.getMatch.data?.event?._id) {
        setEvent(result.data.getMatch.data.event._id);
      }
      // { matchData, token, userInfo, matchId, dispatch }
      await organizeFetchedData({ matchData: result.data.getMatch.data, token: userDetail.token, userInfo: userDetail.info, matchId: params.matchId, dispatch });
    } else {
      dispatch(setActErr({ success: false, message: 'No data found with given ID!' }));
    }
  };
  // ===== Fetch Data =====
  useEffect(() => {
    // Get user info here
    const userDetail = getUserFromCookie();
    if (userDetail && isValidObjectId(params.matchId)) {
      fetchData(userDetail);
    } else {
      dispatch(setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId or Invalid token!' }));
    }

    return () => {
      removeEvent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, getMatch, params.matchId]); // props, client

  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    const userDetail = getUserFromCookie();

    // Initialize socket event listener with required props
    let socketEventListener: SocketEventListener | null = null;

    if (socket && roundList?.length > 0) {
      // Initialize emitEvents with the socket and dispatch props
      const emitEvents = new EmitEvents(socket, dispatch);

      // Emit join room event when the socket is available and round list has data
      emitEvents.joinRoom({
        user: userDetail,
        teamA,
        teamB,
        currRound: currentRound,
        matchId: params.matchId,
      });

      socketEventListener = new SocketEventListener(socket, dispatch, audioPlayEl);

      // Listen to socket events for joining the room
      socket.on('join-room-response-all', (joinData: IRoom) => socketEventListener?.handleJoinRoom(joinData, dispatch));
      socket.on('check-in-response-to-all', (checkInData: IRoom) => socketEventListener?.handleCheckInResponse({ data: checkInData, dispatch, roundList, currentRound }));
      socket.on('submit-lineup-response-all', (lineUpData: IRoomNets) => socketEventListener?.handleLineupResponse({ data: lineUpData, dispatch, currRoundNets, allNets, roundList, currentRound }));
      socket.on(
        'update-points-response-all',
        (pointsData: IUpdateScoreResponse) => socketEventListener?.handleUpdatePoints({ data: pointsData, dispatch, currRoundNets, allNets, currentRound, roundList, match: currMatch }),
      );
      socket.on(
        'update-net-response-all',
        (lineUpData: ITeiBreakerAction) => socketEventListener?.handleUpdateNet({ data: lineUpData, dispatch, allNets, currRoundNets, roundList, match: currMatch }),
      );
    }

    return () => {
      // Clean up event listeners to avoid memory leaks
      socket?.off('join-room-response-all');
      socket?.off('check-in-response-to-all');
      socket?.off('submit-lineup-response-all');
      socket?.off('update-points-response-all');
      socket?.off('update-net-response-all');
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, teamA, teamB, currentRound, roundList, currRoundNets, params.matchId]);

  // ===== Click on DOM by default to get rid of error when playing audio =====
  useEffect(() => {
    if (mainEl && mainEl.current) {
      mainEl.current.click();
    }
  }, [mainEl]);

  // Set team score
  useEffect(() => {
    let teamATS = 0;
    let teamAPMS = 0; // pms = plus minus score
    let teamBTS = 0;
    let teamBPMS = 0; // pms = plus minus score
    for (let i = 0; i < roundList.length; i += 1) {
      const netList = allNets.filter((n) => n.round === roundList[i]._id);
      const { score: tas, plusMinusScore: tapms } = calcRoundScore(netList, roundList[i], ETeam.teamA);
      teamATS += tas;
      teamAPMS += tapms;

      const { score: tbs, plusMinusScore: tbpms } = calcRoundScore(netList, roundList[i], ETeam.teamB);
      teamBTS += tbs;
      teamBPMS += tbpms;
    }

    dispatch(setTeamScore({ teamATotalScore: teamATS, teamBTotalScore: teamBTS, teamBPMScore: teamBPMS, teamAPMScore: teamAPMS }));
  }, [roundList, currMatch, myTeamE, allNets, dispatch]);

  if (loading) return <Loader />;

  const myTeam = myTeamE === ETeam.teamA ? teamA : teamB;
  const opTeam = myTeamE === ETeam.teamA ? teamB : teamA;
  const myS = myTeamE === ETeam.teamA ? teamATotalScore : teamBTotalScore;
  const opS = myTeamE === ETeam.teamA ? teamBTotalScore : teamATotalScore;

  return (
    <div className="h-full relative bg-white text-black-logo" ref={mainEl}>
      {/* Level 1 start */}
      {(error || actErr) && (
        <div className="py-4 bg-black-logo text-white shadow-lg">
          <div className="container mx-auto px-4 ">
            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}
          </div>
        </div>
      )}
      {/* Level 1 end */}

      {/* Level 2 start: hidden */}
      <button ref={audioPlayEl} onClick={handlePlayAudio} type="button" className="hidden" id="playNotificationButton">
        Button
      </button>
      {/* Level 2 end: hidden */}

      {/* Level 4 start: opponent rosters */}
      <div className="op-rosters-wrapper w-full bg-black-logo text-white">
        {/* Level 4.1 start: opponent team name */}
        <motion.div
          className={`w-full bg-black-logo ${myS < opS && currMatch.completed ? 'bg-green-500 text-white' : 'text-gray-100'}`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="op-team-name text-2xl font-bold uppercase container px-4 mx-auto">{opTeam?.name}</h1>
        </motion.div>
        {/* Level 4.1 end: opponent team name */}
        <TeamPlayers teamPlayers={opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} roundList={roundList} screenWidth={screenWidth} onTop />
      </div>
      {/* Level 4 end: opponent rosters */}

      {/* Level 6 start: main match */}
      <div className="main-match-wrapper w-full">
        {notTieBreakerNetId ? (
          <motion.div className="not-tie-breaker w-full bg-white text-black-logo shadow-md rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <NotTieBreaker teamA={teamA} teamB={teamB} ntbnId={notTieBreakerNetId} currRoundNets={currRoundNets} currRound={currentRound} socket={socket} />
          </motion.div>
        ) : (
          <div className="verify-strategy-main-points">
            {verifyLineup ? (
              <VerifyLineup />
            ) : (
              <>
                {currentRound && (
                  <motion.div className="net-score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <NetScoreOfRound currRoundId={currentRound._id} />
                  </motion.div>
                )}
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
                {user?.info &&
                  currRoom &&
                  (user.info.role === UserRole.director || user.info.role === UserRole.admin || user.info.role === UserRole.captain || user.info.role === UserRole.co_captain) && (
                    <motion.div className="my-round-runner w-full" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                      <RoundRunner currentRoom={currRoom} currentRound={currentRound} myTeamE={myTeamE} roundList={roundList} teamA={teamA} currRoundNets={currRoundNets} />
                    </motion.div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Level 6 end: main match */}

      {/* Level 7 start: My Rosters */}
      <div className="my-roster-wrapper w-full bg-black-logo text-white">
        <TeamPlayers roundList={roundList} teamPlayers={myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} screenWidth={screenWidth} />

        <div className="team-name-selection">
          {selectTeam && teamA && teamB ? (
            <motion.div className="select-team-wrapper px-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              <SelectTeam teamA={teamA} teamB={teamB} setSelectTeam={setSelectTeam} />
            </motion.div>
          ) : (
            <motion.div className="w-full" initial={{ y: -10 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
              <div className="container px-4 mx-auto flex justify-between">
                <h1 className="my-team-name text-xl font-bold uppercase">{myTeam?.name}</h1>
                {(user.info?.role === UserRole.director || user.info?.role === UserRole.admin) && (
                  <button className="right-4 z-20" aria-label="select-team" type="button" onClick={() => setSelectTeam(true)}>
                    <Image height={imgSize.tiny.height} width={imgSize.tiny.width} src="/icons/dropdown.svg" className="w-6 svg-white" alt="dropdown-icon" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Level 7 end: My Rosters */}

      {/* Level 8 start: Sponsors */}
      {eventSponsors.length > 0 && (!user || !user.token) && (
        <motion.div className="sponsors w-full py-4 mx-auto bg-black-logo text-white rounded-lg shadow-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <div className="container px-4 mx-auto">
            <h2 className="text-lg font-semibold">Sponsors</h2>
            <div className="flex items-center justify-between md:justify-start flex-wrap w-full gap-4">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image key={spon._id} src={`/${spon.logo}`} height={imgW.xs} width={imgW.xs} alt="default-logo" className="w-20" />
                ) : (
                  <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />
                ),
              )}
            </div>
          </div>
        </motion.div>
      )}
      {/* Level 8 end: Sponsors */}
    </div>
  );
}

export default MatchPage;
