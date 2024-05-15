/* eslint-disable no-nested-ternary */

'use client';

/* eslint-disable no-unused-vars */
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
import { EPlayerStatus, IPlayer } from '@/types/player';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';
import SubbedPlayerList from '@/components/SubbedPlayer/SubbedPlayerList';
import { hasTimePassed, setMusicPlayedTime } from '@/utils/localStorage';
import { APP_NAME } from '@/utils/keys';
import { imgW } from '@/utils/constant';
import Image from 'next/image';

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
  const { myPlayers, opPlayers, myTeamE, myTeam, opTeam, verifyLineup, match: currMatch } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);

  // ===== GraphAL =====
  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);

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
        const result = await fetchMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          organizeFetchedData(result.data.getMatch.data, token, userInfo, params.matchId, dispatch);
        } else {
          dispatch(setActErr({ success: false, message: 'No data found with given ID!' }));
        }
      })();
    } else {
      dispatch(setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, fetchMatch, params.matchId]); // props, client

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

  if (loading) return <Loader />;

  return (
    <Suspense fallback={<Loader />}>
      <div className="h-full relative bg-white text-gray-900" ref={mainEl}>
        <div className="container mx-auto px-4 bg-gray-900">
          {error && <Message error={error} />}
          {actErr && <Message error={actErr} />}
        </div>

        <button ref={audioPlayEl} onClick={handlePlayAudio} type="button" className="hidden" id="playNotificationButton">
          Button
        </button>

        {/* ===== Show oponent subbed players ===== */}
        {opSubbedPlayers && opSubbedPlayers.length > 0 && (
          <div className="subbed-wrapper pt-4 bg-gray-900 text-white">
            <div className="container px-4 mx-auto ">
              <SubbedPlayerList teamPlayers={opSubbedPlayers} currRound={currentRound} roundList={roundList} />
            </div>
          </div>
        )}

        <TeamPlayers teamPlayers={opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} screenWidth={screenWidth} />

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

        {eventSponsors.length > 0 && (!user || !user.token) && (
          <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
            <h3>Sponsors</h3>
            <div className="flex items-center justify-between flex-wrap w-full">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image key={spon._id} src={`/${spon.logo}`} height={imgW.xs} width={imgW.xs} alt="default-logo" className="w-20" />
                ) : (
                  <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />
                ),
              )}
            </div>
          </div>
        )}

        {/* My Players  */}
        <TeamPlayers teamPlayers={myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE)} screenWidth={screenWidth} />
        {/* // Show subbed players  */}
        {mySubbedPlayers && mySubbedPlayers.length > 0 && (
          <div className="subbed-wrapper pt-4 bg-gray-900 text-white">
            <div className="container px-4 mx-auto">
              <SubbedPlayerList teamPlayers={mySubbedPlayers} currRound={currentRound} roundList={roundList} subControl />
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}

export default MatchPage;
