'use client';

/* eslint-disable no-unused-vars */
import Head from 'next/head';
import React, { useEffect, useCallback, Suspense, useState, useRef } from 'react';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import TeamPlayers from '@/components/match/TeamPlayers';
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
import { EPlayerStatus } from '@/types/player';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';

/**
 * Test Match
 * Match URL 
 * http://localhost:3001/matches/65e8cba57c597b83c183c279
 * 
 * FC Barcelona
 * Captain
 * p5e1@e.com
 * Co-captain
 * p4e1@e.com
 * 
 * 
 * Real Madrid
 * Captain
 * p9e1@e.com
 * Co-captain
 * p16e1@e.com
 */

export function MatchPage({ params }: { params: { matchId: string } }) {
  /**
   * @private version
   * Get all the players of the match
   * Players of my team and players of oponent team
   * Get all rounds and the round we are on
   */
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  const audioPlayEl = useRef<HTMLButtonElement>(null);

  // Redux States
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth, actErr } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, nets: allNets, notTieBreakerNetId } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, opTeamE, myTeamE, myTeam, opTeam, verifyLineup, match: currMatch} = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);


  // GraphAL
  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);

  const handlePlayAudio = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const audio = new Audio('/audio/notification.mp3');
    audio.play().catch(error => console.error(error));
  }

  const restartAudio = () => {
    if (audioPlayEl.current) audioPlayEl.current.click();
  };

  /**
   * Fetch data
   */
  useEffect(() => {
    // Get user info here
    const token = !getCookie('token') || getCookie('token')?.trim() === '' ? null : getCookie('token');
    const findUser = getCookie('user');
    const userInfo = findUser && findUser.trim() !== '' ? JSON.parse(findUser) : null;

    if (isValidObjectId(params.matchId)) {
      (async () => {
        const result = await fetchMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          organizeFetchedData(result.data.getMatch.data, token, userInfo, params.matchId, dispatch);
        } else {
          dispatch(setActErr({ name: "Invalid Id", message: "No data found with given ID!" }));
        }
      })();
    } else {
      dispatch(setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, fetchMatch, params.matchId]); // props, client


  /**
   * Web socket real time connection
   */
  useEffect(() => {
    if (socket && roundList && roundList.length > 0) {
      const userInfo = getCookie("user");
      const userToken = getCookie("token");

      joinTheRoom({ socket, userInfo, userToken, teamA, teamB, currRound: currentRound, matchId: params.matchId })
      listenSocketEvents({ socket, user, teamA, dispatch, currentRound, currRoundNets, allNets, roundList, restartAudio });
    }

  }, [socket, user, teamA, teamB, roundList]);


  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  if (loading) return <Loader />;



  return (
    <React.Fragment>
      <Head>
        <title>Spike Ball</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Suspense fallback={<Loader />}>
        <div className="h-full relative bg-gray-100 text-gray-800" ref={mainEl}>
          {error && <Message error={error} />}
          {actErr && <Message error={actErr} />}

          <button ref={audioPlayEl} onClick={handlePlayAudio} className="hidden" id="playNotificationButton"></button>

          <TeamPlayers teamPlayers={opPlayers.filter(p => p.status !== EPlayerStatus.INACTIVE)} team={opTeamE} screenWidth={screenWidth} />
          {notTieBreakerNetId ? <NotTieBreaker teamA={teamA} teamB={teamB} ntbnId={notTieBreakerNetId} currRoundNets={currRoundNets} screenWidth={screenWidth} currRound={currentRound} socket={socket} /> : (
            verifyLineup
              ? <VerifyLineup />
              : (<React.Fragment>
                {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}
                <LineupStrategy myTeamE={myTeamE} currRound={currentRound} myPlayers={myPlayers} opPlayers={opPlayers} currRoundNets={currRoundNets} allNets={allNets} roundList={roundList} currMatch={currMatch} />
                {user && user.info && currRoom && (user.info.role === UserRole.captain || user.info.role === UserRole.co_captain)
                  && <RoundRunner currentRoom={currRoom} currentRound={currentRound} myTeamE={myTeamE} roundList={roundList} teamA={teamA} currRoundNets={currRoundNets} />}
              </React.Fragment>)
          )}

          {eventSponsors.length > 0 && (!user || !user.token) && (
            <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
              <h3>Sponsors</h3>
              <div className="flex items-center justify-between flex-wrap w-full">
                {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
              </div>
            </div>
          )}
          {/* My Players  */}
          <TeamPlayers teamPlayers={myPlayers.filter(p => p.status !== EPlayerStatus.INACTIVE)} team={myTeamE} screenWidth={screenWidth} />
        </div>
      </Suspense>
    </React.Fragment>
  );
}

export default MatchPage;
