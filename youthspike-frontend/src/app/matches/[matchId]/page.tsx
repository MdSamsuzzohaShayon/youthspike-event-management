'use client';

/* eslint-disable no-unused-vars */
import Head from 'next/head';
import React, { useEffect, useCallback, Suspense, useState } from 'react';

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
import { canGoNextOrPrevRound, joinTheRoom } from '@/utils/match/emitSocketEvents';
import { UserRole } from '@/types/user';
import LineupStrategy from '@/components/match/LineupStrategy';

/**
 * Test Match
 * Match URL 
 * http://localhost:3001/matches/65e0879b81d16290815d65ff
 * 
 * Team Mal
 * Captain
 * grace.adams@yp.com
 * Co-captains
 * james.robinson@yp.com
 * 
 * 
 * team Sri
 * Captain
 * john.doe@yp.com
 * Co-captains
 * michael.johnson@yp.com
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

  // Redux States
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const { screenWidth, actErr } = useAppSelector((state) => state.elements);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, updateNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, opTeamE, myTeamE, myTeam, opTeam } = useAppSelector((state) => state.matches);


  // GraphAL
  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);


  const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    /**
     * Before completing current round someone can not go to the next round
     * Round must have team a score and team b score to proceed
     * Change current round nets
     */
    const newRoundIndex = canGoNextOrPrevRound({ currRound: currentRound, roundList, next, currRoundNets, dispatch });
    if (newRoundIndex !== -1) {
      // changeTheRound({ socket, roundList, currRound: currentRound, dispatch, allNets, currRoom: currentRoom, newRoundIndex, myTeamE, opTeamProcess })
    }
  }

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
      listenSocketEvents({ socket, user, teamA, dispatch, currentRound, currRoundNets, allNets, roundList });
    }

  }, [socket, user, teamA, teamB, roundList]);


  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  if (loading) return <Loader />;
  

  return (
    <>
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
          <TeamPlayers teamPlayers={opPlayers} team={opTeamE} screenWidth={screenWidth} />

          {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}
          <LineupStrategy myTeamE={myTeamE} currRound={currentRound} myPlayers={myPlayers} currRoundNets={currRoundNets} allNets={allNets}  roundList={roundList}/>


          {user && user.info && (user.info.role === UserRole.captain || user.info.role === UserRole.co_captain) && <RoundRunner />}
          {eventSponsors.length > 0 && !user && (
            <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
              <h3>Sponsors</h3>
              <div className="flex items-center justify-between flex-wrap w-full">
                {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
              </div>
            </div>
          )}
          {/* My Players  */}
          <TeamPlayers teamPlayers={myPlayers} team={myTeamE} screenWidth={screenWidth} />
        </div>
      </Suspense>
    </>
  );
}

export default MatchPage;
