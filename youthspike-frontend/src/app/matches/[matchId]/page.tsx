/* eslint-disable no-nested-ternary */

'use client';

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLazyQuery } from '@apollo/client';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';

// Hooks & Utilities
import useResizeObserver from '@/hooks/useResizeObserver';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useUser } from '@/lib/UserProvider';
import { useSocket } from '@/lib/SocketProvider';
import { getUserFromCookie } from '@/utils/cookie';
import { isValidObjectId } from '@/utils/helper';
import { APP_NAME } from '@/utils/keys';
import { calcRoundScore } from '@/utils/scoreCalc';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import localStorageService from '@/utils/LocalStorageService';
import cld from '@/config/cloudinary.config';

// Components
import TeamPlayers from '@/components/player/TeamPlayers';
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';
import Loader from '@/components/elements/Loader';
import LineupStrategy from '@/components/match/LineupStrategy';
import VerifyLineup from '@/components/ActionBoxes/VerifyLineup';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';
import SelectTeam from '@/components/match/SelectTeam';

// GraphQL & Redux
import { GET_MATCH_DETAIL } from '@/graphql/matches';
import { setActErr, setScreenSize } from '@/redux/slices/elementSlice';
import { setTeamScore } from '@/redux/slices/matchesSlice';

// Types & Constants
import { IUserContext, IRoom, IRoomNets, IOvertimeData, IUpdateScoreResponse } from '@/types';
import { ITeiBreakerAction } from '@/types/room';
import EmitEvents from '@/utils/socket/EmitEvents';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { ETeam } from '@/types/team';
import { EPlayerStatus } from '@/types/player';
import { UserRole } from '@/types/user';
import { imgSize } from '@/utils/styles';

export function MatchPage({ params }: { params: { matchId: string } }) {
  // Refs
  const audioPlayEl = useRef<HTMLButtonElement>(null);
  const mainEl = useResizeObserver(
    useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
      dispatch(setScreenSize(entry.contentRect.width));
    }, []),
  );

  // State
  const [selectTeam, setSelectTeam] = useState(false);
  const [getMatch, { loading }] = useLazyQuery(GET_MATCH_DETAIL, { variables: { matchId: params.matchId } });

  // Context and Redux
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Selectors
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, nets: allNets, notTieBreakerNetId } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, myTeamE, verifyLineup, match: currMatch, teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);

  // Memoized values
  const myTeam = useMemo(() => (myTeamE === ETeam.teamA ? teamA : teamB), [myTeamE, teamA, teamB]);
  const opTeam = useMemo(() => (myTeamE === ETeam.teamA ? teamB : teamA), [myTeamE, teamA, teamB]);
  const myS = useMemo(() => (myTeamE === ETeam.teamA ? teamATotalScore : teamBTotalScore), [myTeamE, teamATotalScore, teamBTotalScore]);
  const opS = useMemo(() => (myTeamE === ETeam.teamA ? teamBTotalScore : teamATotalScore), [myTeamE, teamATotalScore, teamBTotalScore]);
  const activeMyPlayers = useMemo(() => myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE), [myPlayers]);
  const activeOpPlayers = useMemo(() => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE), [opPlayers]);
  const showSponsors = useMemo(() => eventSponsors.length > 0 && (!user || !user.token), [eventSponsors.length, user]);
  const captainAccess: boolean = useMemo(() => {
    if (user.info?.role !== UserRole.captain && user.info?.role !== UserRole.co_captain) {
      return true;
    }
    if (user.info.captainplayer) {
      if (user.info.captainplayer === teamA?.captain?._id || user.info.captainplayer === teamB?.captain?._id) {
        return true;
      }
    }
    if (user.info.cocaptainplayer) {
      if (user.info.cocaptainplayer === teamA?.cocaptain?._id || user.info.captainplayer === teamB?.cocaptain?._id) {
        return true;
      }
    }
    return false;
  }, [user, teamA, teamB]);

  const handlePlayAudio = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (localStorageService.hasTimePassed(5)) {
      const audio = new Audio('/audio/notification.mp3');
      audio.play().catch(console.error);
      localStorageService.setMusicPlayedTime();
    }
  }, []);

  const fetchData = useCallback(
    async (userDetail: IUserContext) => {
      const result = await getMatch({ variables: { matchId: params.matchId } });

      if (result?.data?.getMatch?.data) {
        if (result.data.getMatch.data?.event?._id) {
          localStorageService.setEvent(result.data.getMatch.data.event._id);
        }
        await organizeFetchedData({
          matchData: result.data.getMatch.data,
          token: userDetail.token,
          userInfo: userDetail.info,
          matchId: params.matchId,
          dispatch,
        });
      } else {
        dispatch(setActErr({ success: false, message: 'No data found with given ID!' }));
      }
    },
    [getMatch, params.matchId, dispatch],
  );

  // Effects
  useEffect(() => {
    const userDetail = getUserFromCookie();
    if (userDetail && isValidObjectId(params.matchId)) {
      fetchData(userDetail);
    } else {
      dispatch(setActErr({ success: false, message: 'Invalid event ID or token!' }));
    }

    return () => localStorageService.removeEvent();
  }, [params.matchId, fetchData, dispatch]);

  useEffect(() => {
    if (!socket || roundList.length === 0) {
      console.warn("No socket or round list available", );
      return;
    }
    console.log("Everything available");
    


    const userDetail = getUserFromCookie();
    const emitEvents = new EmitEvents(socket, dispatch);
    const socketEventListener = new SocketEventListener(socket, dispatch, audioPlayEl);

    emitEvents.joinRoom({
      user: userDetail,
      teamA,
      teamB,
      currRound: currentRound,
      matchId: params.matchId,
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
  }, [socket, teamA, teamB, currentRound, roundList, currRoundNets, params.matchId, dispatch, currMatch, allNets]);

  useEffect(() => {
    mainEl.current?.click();
  }, [mainEl]);

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

  if (loading) return <Loader />;

  return (
    <div className="h-full relative bg-white text-black-logo" ref={mainEl}>
      <button ref={audioPlayEl} onClick={handlePlayAudio} type="button" className="hidden">
        Button
      </button>

      <div className="op-rosters-wrapper w-full bg-black-logo text-white">
        <motion.div
          className={`w-full bg-black-logo ${myS < opS && currMatch.completed ? 'bg-green-500 text-white' : 'text-gray-100'}`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="op-team-name text-2xl font-bold uppercase container px-4 mx-auto">{opTeam?.name}</h1>
        </motion.div>
        <TeamPlayers teamPlayers={activeOpPlayers} roundList={roundList} screenWidth={screenWidth} onTop />
      </div>

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
                {user?.info && currRoom && [UserRole.director, UserRole.admin, UserRole.captain, UserRole.co_captain].includes(user.info.role) && captainAccess && (
                  <motion.div className="my-round-runner w-full" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                    <RoundRunner currentRoom={currRoom} currentRound={currentRound} myTeamE={myTeamE} roundList={roundList} teamA={teamA} currRoundNets={currRoundNets} />
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="my-roster-wrapper w-full bg-black-logo text-white">
        <TeamPlayers roundList={roundList} teamPlayers={activeMyPlayers} screenWidth={screenWidth} />

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
                    <Image width={24} height={24} src="/icons/dropdown.svg" className="w-6 svg-white" alt="dropdown-icon" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showSponsors && (
        <motion.div className="sponsors w-full py-4 mx-auto bg-black-logo text-white rounded-lg shadow-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <div className="container px-4 mx-auto">
            <h2 className="text-lg font-semibold">Sponsors</h2>
            <div className="flex items-center justify-between md:justify-start flex-wrap w-full gap-4">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image key={spon._id} src={`/${spon.logo}`} width={40} height={40} alt="default-logo" className="w-20" />
                ) : (
                  <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />
                ),
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MatchPage;
