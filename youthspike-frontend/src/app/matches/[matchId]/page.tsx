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
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { setCurrentRoundNets, setNets, updateMultiNetsPlayers } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setIsLoading, setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { getCookie } from '@/utils/cookie';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
// Types
import { INetRelatives, IUpdateScoreResponse } from '@/types/net';
import { useUser } from '@/lib/UserProvider';
import Message from '@/components/elements/Message';
import { useSocket } from '@/lib/SocketProvider';
import { ETeam } from '@/types/team';
import { EActionProcess, IError } from '@/types/elements';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { handleError, isValidObjectId } from '@/utils/helper';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import { setTeamProcess } from '@/redux/slices/matchesSlice';
import listenSocketEvents from '@/utils/match/listenSocketEvents';

/**
 * Test Match
 * christopher.hall@yp.com
 * jane.smith@yp.com
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
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, updateNets, nets: allNets } = useAppSelector((state) => state.nets);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { myPlayers, opPlayers, opTeamE, myTeamE, myTeam, opTeam, myTeamProcess, opTeamProcess } = useAppSelector((state) => state.matches);

  const [actErr, setActErr] = useState<IError | null>(null);

  // GraphAL
  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);
  const [mutateNet, { data: mData, error: mErr }] = useMutation(UPDATE_NETS);

  /**
   * Event handlers
   */
  const handleUpdatePoints = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const netPointsList = [];
    for (const n of updateNets) {
      const nObj = {
        _id: n._id,
        teamAScore: n.teamAScore ? n.teamAScore : 0,
        teamBScore: n.teamBScore ? n.teamBScore : 0,
      };
      netPointsList.push(nObj);
    }
    // @ts-ignore
    socket.emit("update-points-from-client", { nets: netPointsList, room: currentRoom?._id, round: currentRound?._id });

  }

  const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    /**
     * Before completing current round someone can not go to the next round
     * Round must have team a score and team b score to proceed
     * Change current round nets
     */
    const findRoundIndex = roundList.findIndex((r) => r._id === currentRound?._id);
    if (findRoundIndex === -1) return;
    let newRoundIndex = 0;
    if (next) {
      let canGoNext = true;
      for (const currNet of currRoundNets) {
        if (!currNet.teamAScore || !currNet.teamBScore) canGoNext = false;
      }
      if (!canGoNext) {
        return setActErr({ name: "Incomplete round!", message: "Make sure you have completed this round by putting players on all of the nets and points." })
      }
      if ((!currentRound?.teamAScore || currentRound?.teamAScore === 0 || !currentRound?.teamBScore || currentRound?.teamBScore === 0)) return;

      if (roundList[findRoundIndex + 1]) {
        newRoundIndex = findRoundIndex + 1;
      }
    } else {
      if (findRoundIndex !== 0) {
        newRoundIndex = findRoundIndex - 1;
      }
    }

    const crObj = roundList[newRoundIndex];
    dispatch(setCurrentRound(crObj));
    const filteredNets = allNets.filter((net) => net.round === crObj._id);
    dispatch(setCurrentRoundNets(filteredNets));


    const nextRound = roundList[newRoundIndex]._id;
    const rcd = { room: currentRoom?._id, round: currentRound?._id, nextRound };
    if (currentRoom) {
      const newCurrRoom = { ...currentRoom, round: roundList[newRoundIndex]._id };
      if (myTeamE === ETeam.teamA) {
        newCurrRoom.teamAProcess = EActionProcess.CHECKIN;
        newCurrRoom.teamARound = nextRound;
      } else {
        newCurrRoom.teamBProcess = EActionProcess.CHECKIN;
        newCurrRoom.teamBRound = nextRound;
      }
      dispatch(setCurrentRoom(newCurrRoom));
      dispatch(setTeamProcess({ myTeamProcess: EActionProcess.CHECKIN, opTeamProcess }));
    }
    // @ts-ignore
    if (socket) socket.emit("round-change-from-client", rcd);
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
          setActErr({ name: "Invalid Id", message: "No data found with given ID!" })
        }
      })();
    } else {
      setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, fetchMatch, params.matchId]); // props, client


  /**
   * Web socket real time connection
   */
  useEffect(() => {
    if (socket) {
      listenSocketEvents({ socket, user, teamA, teamB, dispatch, currentRound, params, currRoundNets, allNets, roundList });
    }

  }, [socket, user, teamA, teamB]);


  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  if (loading) return <Loader />;


  // Renders
  const renderTeams = (): React.ReactNode => {
    return (<>
      <TeamPlayers teamPlayers={opPlayers} team={opTeamE} />
      {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}
      {opTeamProcess && <RoundRunner />}
      {eventSponsors.length > 0 && !user && (
        <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
          <h3>Sponsors</h3>
          <div className="flex items-center justify-between flex-wrap w-full">
            {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
          </div>
        </div>
      )}
      <TeamPlayers teamPlayers={myPlayers} team={myTeamE} />
    </>);
  }

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
          {user && user.info ? (<>
            {renderTeams()}
            {/* <div className='controls px-4 flex justify-center mt-4 w-full'>
              <button className='btn-secondary capitalize' type="button" onClick={handleNetUpdate}>Update</button>
            </div> */}
            <div className="controls px-4 flex justify-center mt-4 gap-2">
              {currentRound?.num !== 1 && (
                <button className='btn-secondary capitalize flex justify-between items-center' type="button" onClick={(e) => handleChangeRound(e, false)}>
                  <img src="/icons/right-arrow.svg" alt="" className="w-6 h-6 object-center object-cover svg-white" style={{ transform: 'scaleX(-1)' }} />
                  Prev round
                </button>
              )}
              {(currentRound?.teamAScore && currentRound.teamAScore !== 0 && currentRound?.teamBScore && currentRound?.teamBScore !== 0) && currentRound.num < roundList.length && (
                <button className='btn-secondary capitalize flex justify-between items-center' type="button" onClick={(e) => handleChangeRound(e, true)}>Next round
                  <img src="/icons/right-arrow.svg" alt="" className="w-6 h-6 object-center object-cover svg-white" />
                </button>
              )}
            </div>
          </>) : (<>
            {/* Public Version Start ============================================> */}
            <TeamPlayers teamPlayers={opPlayers} team={opTeamE} />

            {/* Net  */}
            {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}

            {eventSponsors && eventSponsors.length > 0 && (
              <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
                <h3>Sponsors</h3>
                <div className="flex items-center justify-between flex-wrap w-full">
                  {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
                </div>
              </div>
            )}
            {/* My Players  */}
            <TeamPlayers teamPlayers={myPlayers} team={myTeamE} />
            {/* Public Version End ============================================> */}
          </>)}
        </div>
      </Suspense>
    </>
  );
}

export default MatchPage;
