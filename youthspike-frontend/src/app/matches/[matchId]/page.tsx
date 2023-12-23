'use client';

/* eslint-disable no-unused-vars */
// http://localhost:3001/matches/6583df73a31ed7dedcc16909
import Head from 'next/head';
import { redirect } from 'next/navigation';
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback, Suspense } from 'react';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import TeamPlayers from '@/components/match/TeamPlayers';
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';
import Loader from '@/components/elements/Loader';

// GraphQL
import { useLazyQuery } from '@apollo/client';
import { GET_MATCH_DETAIL } from '@/graphql/matches';

// Redux
import { setMatchInfo } from '@/redux/slices/matchesSlice';
import { setTeamA, setTeamB } from '@/redux/slices/teamSlice';
import { setTeamAPlayers, setTeamBPlayers } from '@/redux/slices/playerSlice';
import { setCurrentEventInfo } from '@/redux/slices/eventSlice';
import { setRoundList } from '@/redux/slices/roundSlice';
import { setNets } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { screen } from '@/utils/constant';

// Types
import { ITeam, IMatchExpRel, IPlayer, IEvent, INetBase } from '@/types';
import { IRoundBase, IRoundExpRel, IRoundRelatives } from '@/types/round';
import { getCookie } from '@/utils/cookie';
import { INetRelatives } from '@/types/net';




export function MatchPage({ params }: { params: { matchId: string } }) {
  /**
   * @private version
   * Get all the players of the match
   * Players of my team and players of oponent team
   * Get all rounds and the round we are on
   */
  const dispatch = useAppDispatch();
  const teamAPlayers = useAppSelector((state) => state.players.teamAPlayers);
  const teamBPlayers = useAppSelector((state) => state.players.teamBPlayers);
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);

  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);

  const setStateGetMatchData = (matchData: IMatchExpRel) => {
    /**
     * Setting data as state of redux that is fetched from backend using GraphAL
     */

    const { _id, location, numberOfNets, numberOfRounds, netRange, teamA, teamB, date, rounds, event } = matchData;

    /**
     * Setting teams
     */
    dispatch(setTeamA({ ...teamA }));
    dispatch(setTeamB({ ...teamB }));

    /**
     * Setting players
     */
    if (teamA.players) {
      const reformatAPlayers = teamA.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamA._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
      dispatch(setTeamAPlayers(reformatAPlayers));
    }
    if (teamB.players) {
      const reformatBPlayers = teamB.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamA._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
      dispatch(setTeamBPlayers(reformatBPlayers));
    }

    /**
     * Setting event
     */
    // if(event){
    //   dispatch(setCurrentEventInfo({
    //     _id: event._id,
    //     name: event.normalize,
    //     startDate: string;
    //     endDate: string;
    //     playerLimit: number;
    //     active: boolean;
    //     sponsors: string[];
    //   }));
    // }

    /**
     * Setting rounds and nets
     */
    const formattedRounds: IRoundRelatives[] = [];
    const formattedNets: INetRelatives[] = [];

    for (const round of rounds) {
      const playerIds = round.players ? round.players.map((r)=> r._id) : [];
      const subIds = round.subs ? round.subs.map((r)=> r._id) : [];
      const roundObj: IRoundRelatives = { _id: round._id, num: round.num, nets: [], players: playerIds, subs: subIds, match: params.matchId};
      if(round.nets && round.nets.length > 0){
        const netIds: string[] =[];
        for(const n of round.nets){
          netIds.push(n._id);
          formattedNets.push({_id: n._id, num: n.num, points: n.points, teamAScore: n.teamAScore, teamBScore: n.teamBScore, pairRange: n.pairRange, round: round._id});
        }
        roundObj.nets = netIds;
      }
      formattedRounds.push(roundObj);
    }

    dispatch(setNets(formattedNets));
    dispatch(setRoundList(formattedRounds));

    /**
     * Setting match
     */
    dispatch(
      setMatchInfo({
        _id,
        date,
        location,
        numberOfNets,
        numberOfRounds,
        netRange,
        teamA: teamA._id,
        teamB: teamB._id,
        event: event._id
      }),
    );
  };

  useEffect(() => {
    // Set user info here
    const token = getCookie('token');
    const userInfo = getCookie('user');

    if (params.matchId) {
      (async () => {
        const result = await fetchMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          setStateGetMatchData(result.data.getMatch.data);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, fetchMatch, params.matchId]); // props, client

  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  if (loading) return <Loader />;
  // if (error) return redirect('/');

  return (
    <>
      <Head>
        <title>Spike Ball</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Suspense fallback={<Loader />}>
        <div className="bg-[#FCFCFC] h-full relative" ref={mainEl}>
          {/* Oponents Players  */}
          <TeamPlayers teamPlayers={teamAPlayers} />
          {/* Oponent Round Runner  */}
          <RoundRunner />
          <NetScoreOfRound />
          {/* My Round Runner */}
          <RoundRunner />
          {/* My Players  */}
          <TeamPlayers teamPlayers={teamBPlayers} />
        </div>
      </Suspense>
    </>
  );
}

export default MatchPage;
