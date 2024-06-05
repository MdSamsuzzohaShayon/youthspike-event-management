/* eslint-disable no-nested-ternary */

'use client';

/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback, Suspense, useState, useRef } from 'react';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import TeamPlayers from '@/components/player/TeamPlayers';
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';
import Loader from '@/components/elements/Loader';

// GraphQL
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_MATCH_DETAIL } from '@/graphql/matches';
import { UPDATE_NETS } from '@/graphql/net';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActErr, setIsLoading, setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { getCookie } from '@/utils/cookie';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
// Types
import { useUser } from '@/lib/UserProvider';
import Message from '@/components/elements/Message';
import { useSocket } from '@/lib/SocketProvider';
import { handleError, isValidObjectId } from '@/utils/helper';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import listenSocketEvents from '@/utils/match/listenSocketEvents';
import { joinTheRoom } from '@/utils/match/emitSocketEvents';
import { UserRole } from '@/types/user';
import LineupStrategy from '@/components/match/LineupStrategy';
import VerifyLineup from '@/components/ActionBoxes/VerifyLineup';
import { EPlayerStatus, IPlayer } from '@/types/player';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';
import SubbedPlayerList from '@/components/SubbedPlayer/SubbedPlayerList';
import { hasTimePassed, removeEvent, setEvent, setMusicPlayedTime } from '@/utils/localStorage';
import { APP_NAME } from '@/utils/keys';
import { imgW } from '@/utils/constant';
import Image from 'next/image';
import { ETeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';
import { setTeamScore } from '@/redux/slices/matchesSlice';

import './Match.css';

/**
 * Test Match
 *
 * Borussia Dortmund
 * Captain
 * pfn826
 * Co-captains
 * pfn526
 *
 *
 * Bayern Munich FC
 * Captain
 * pfn125
 * Co-captains
 * pfn325
 *
 *
 * RB Leipzig
 * Captain
 * pfn1627
 * Co-captain
 * pfn1727
 */
export function MatchPage({ params }: { params: { matchId: string } }) {
  // ===== Hooks =====
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // ===== Local State =====
  const audioPlayEl = useRef<HTMLButtonElement>(null);
  const [opSubbedPlayers, setOpSubbedPlayers] = useState<IPlayer[]>([]);
  const [mySubbedPlayers, setMySubbedPlayers] = useState<IPlayer[]>([]);

  // ===== Redux States =====
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth, actErr } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, nets: allNets, notTieBreakerNetId } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, myTeamE, verifyLineup, match: currMatch, teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);

  // ===== GraphAL =====
  const [getMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);

  const handlePlayAudio = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const timePassed = hasTimePassed(5);
    if (timePassed) {
      const audio = new Audio('/audio/notification.mp3');
      audio.play().catch((musicErr) => console.error(musicErr));
      setMusicPlayedTime();
    }
  };

  const restartAudio = () => {
    if (audioPlayEl.current) audioPlayEl.current.click();
  };

  // ===== Component resize =====
  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  // ===== Fetch Data =====
  useEffect(() => {
    // Get user info here
    const token = !getCookie('token') || getCookie('token')?.trim() === '' ? null : getCookie('token');
    const findUser = getCookie('user');
    const userInfo = findUser && findUser.trim() !== '' ? JSON.parse(findUser) : null;

    if (isValidObjectId(params.matchId)) {
      (async () => {
        const result = await getMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          if (result.data.getMatch.data?.event?._id) setEvent(result.data.getMatch.data.event._id);
          // { matchData, token, userInfo, matchId, dispatch }
          organizeFetchedData({ matchData: result.data.getMatch.data, token, userInfo, matchId: params.matchId, dispatch });
        } else {
          dispatch(setActErr({ success: false, message: 'No data found with given ID!' }));
        }
      })();
    } else {
      dispatch(setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' }));
    }

    return () => {
      removeEvent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, getMatch, params.matchId]); // props, client

  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    if (socket && roundList && roundList.length > 0) {
      const userInfo = getCookie('user');
      const userToken = getCookie('token');

      joinTheRoom({ socket, userInfo, userToken, teamA, teamB, currRound: currentRound, matchId: params.matchId });
      listenSocketEvents({ socket, match: currMatch, dispatch, currentRound, currRoundNets, allNets, roundList, restartAudio });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, teamA, teamB, roundList]);

  // ===== Subbed & Inactive players =====
  useEffect(() => {
    if (currentRound && myPlayers) {
      const nmsp = []; // new subbed players
      for (let i = 0; i < currentRound.subs.length; i += 1) {
        const playerExist = myPlayers.find((p) => currentRound.subs && p._id === currentRound.subs[i]);
        if (playerExist && playerExist.status !== EPlayerStatus.INACTIVE) {
          nmsp.push(playerExist);
        }
      }
      setMySubbedPlayers(nmsp);
    }
    if (currentRound && opPlayers) {
      const nosp = []; // new subbed players
      for (let i = 0; i < currentRound.subs.length; i += 1) {
        const playerExist = opPlayers.find((p) => currentRound.subs && p._id === currentRound.subs[i]);
        if (playerExist && playerExist.status !== EPlayerStatus.INACTIVE) {
          nosp.push(playerExist);
        }
      }
      setOpSubbedPlayers(nosp);
    }
  }, [roundList, currentRound, myPlayers, opPlayers]);

  // ===== Click on DOM by default to get rid of error when playing audio =====
  useEffect(() => {
    if (mainEl && mainEl.current) {
      mainEl.current.click();
    }
  }, [mainEl]);

  useEffect(() => {
    // const calcTeamScore = () => {
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
      {/* Level 1 start  */}
      <div className="container mx-auto px-4 bg-black-logo">
        {error && <Message error={error} />}
        {actErr && <Message error={actErr} />}
      </div>
      {/* Level 1 end  */}

      {/* Level 2 start: hidden  */}
      <button ref={audioPlayEl} onClick={handlePlayAudio} type="button" className="hidden" id="playNotificationButton">
        Button
      </button>
      {/* Level 2 end: hidden  */}

      {/* Level 3 start: sub of oponents  */}
      {opSubbedPlayers && opSubbedPlayers.length > 0 && (
        <div className="subbed-wrapper pt-4 bg-black-logo text-white">
          <div className="container px-4 mx-auto ">
            <SubbedPlayerList teamPlayers={opSubbedPlayers} currRound={currentRound} roundList={roundList} />
          </div>
        </div>
      )}
      {/* Level 3 end: sub of oponents  */}

      {/* Level 4 start: oponent rosters  */}
      <div className="op-rosters-wrapper w-full">
        <TeamPlayers teamPlayers={opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} screenWidth={screenWidth} onTop />
        <div className="op-team-bottom-wrapper h-4" /> {/* Placeholder */}
        <div className="name-wrapper px-4">
          <div className="container px-4 mx-auto text-center relative z-10">
            <div className={`w-full bg-black-logo absolute bottom-0 left-0 ${myS < opS && currMatch.completed ? 'bg-green-500 text-white' : 'text-gray-100'}`}>
              <h1 className="op-team-name h1 uppercase ">{opTeam?.name}</h1>
            </div>
          </div>
        </div>
      </div>
      {/* Level 4 end: oponent rosters  */}

      {/* Level 6 start: main match  */}
      {notTieBreakerNetId ? (
        <NotTieBreaker teamA={teamA} teamB={teamB} ntbnId={notTieBreakerNetId} currRoundNets={currRoundNets} screenWidth={screenWidth} currRound={currentRound} socket={socket} />
      ) : verifyLineup ? (
        <VerifyLineup />
      ) : (
        <>
          {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}

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
          {user && user.info && currRoom && (user.info.role === UserRole.captain || user.info.role === UserRole.co_captain) && (
            <RoundRunner currentRoom={currRoom} currentRound={currentRound} myTeamE={myTeamE} roundList={roundList} teamA={teamA} currRoundNets={currRoundNets} />
          )}
        </>
      )}
      {/* Level 6 end: main match  */}

      {/* Level 7 start: My Rosters  */}
      <div className="my-roster-wrapper w-full">
        {/*  My Team  */}
        <div className="name-wrapper px-4">
          <div className="container mx-auto text-center  relative">
            <div className={`w-full absolute top-0 z-10 left-0 ${myS > opS && currMatch.completed ? 'bg-green-500 text-white' : 'bg-white text-black-logo'}`}>
              <h1 className="op-team-name h1 uppercase">{myTeam?.name}</h1>
            </div>
          </div>
          <div className="my-team-top-wrapper h-5" /> {/* Placeholder */}
        </div>
        {/* My Team  */}
        <TeamPlayers teamPlayers={myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} screenWidth={screenWidth} />
      </div>
      {/* // Show subbed players  */}
      {mySubbedPlayers && mySubbedPlayers.length > 0 && (
        <div className="subbed-wrapper pt-4 bg-black-logo text-white">
          <div className="container px-4 mx-auto">
            <SubbedPlayerList teamPlayers={mySubbedPlayers} currRound={currentRound} roundList={roundList} subControl={!currentRound?.completed} />
          </div>
        </div>
      )}
      {/* Level 7 end: My Rosters  */}

      {/* Level 8 start: Sponsors  */}
      {eventSponsors.length > 0 && (!user || !user.token) && (
        <div className="sponsors w-full pt-2 mx-auto mb-2 bg-black-logo text-white">
          <div className="container px-4 mx-auto">
            <h2 className='mt-4'>Sponsors</h2>
            <div className="flex items-center justify-between md:justify-start flex-wrap w-full">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image key={spon._id} src={`/${spon.logo}`} height={imgW.xs} width={imgW.xs} alt="default-logo" className="w-20" />
                ) : (
                  <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />
                ),
              )}
            </div>
          </div>
        </div>
      )}
      {/* Level 8 end: Sponsors  */}
    </div>
  );
}

export default MatchPage;
