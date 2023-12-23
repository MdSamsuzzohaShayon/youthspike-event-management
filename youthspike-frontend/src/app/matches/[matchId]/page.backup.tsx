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
import { setCurrentLeagueInfo } from '@/redux/slices/eventSlice';
import { setRoundList } from '@/redux/slices/roundSlice';
import { setNets } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { screen } from '@/utils/constant';

// Types
import { ITeam, IMatch, IPlayer, IEvent } from '@/types';

interface IRoundModify extends IRound {
  nets: INet[];
}

interface IMatchFetch extends IMatch {
  teamA: ITeam;
  teamB: ITeam;
  league: ILeague;
  rounds: IRoundModify[];
}

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

  const setStateGetMatchData = (matchData: IMatchFetch) => {
    /**
     * Setting data as state of redux that is fetched from backend using GraphAL
     */

    const { _id, location, numberOfNets, numberOfRounds, netRange, teamA, teamB, date, rounds } = matchData;

    /**
     * Setting teams
     */
    dispatch(setTeamA({ _id: teamA._id, active: teamA.active, leagueId: teamA.leagueId, coachId: teamA.coachId, name: teamA.name }));
    dispatch(setTeamB({ _id: teamB._id, active: teamB.active, leagueId: teamB.leagueId, coachId: teamB.coachId, name: teamB.name }));

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
          profile: player.profile,
          captainofteam: player.captainofteam
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
          team: player.team,
          event: player.event,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
      dispatch(setTeamBPlayers(reformatBPlayers));
    }

    /**
     * Setting league
     */
    dispatch(setCurrentLeagueInfo({ _id: league._id, name: league.name, startDate: league.startDate, endDate: league.endDate, active: league.active, playerLimit: league.playerLimit }));

    /**
     * Setting rounds
     */
    const formatRounds = rounds.map((round: IRound) => {
      const newRound: IRound = {
        _id: round._id,
        locked: round.locked,
        num: round.num,
      };
      return newRound;
    });
    dispatch(setRoundList(formatRounds));

    /**
     * Setting nets for different rounds
     */
    const netList: INet[] = [];
    for (let i = 0; i < rounds.length; i += 1) {
      Array.prototype.push.apply(netList, rounds[i].nets);
    }
    dispatch(setNets(netList));

    /**
     * Setting match
     */
    dispatch(
      setMatchInfo({
        _id,
        teamAId,
        teamBId,
        leagueId,
        date,
        location,
        numberOfNets,
        numberOfRounds,
        netRange,
        pairLimit,
        active,
        roundIdList: [],
      }),
    );
  };

  useEffect(() => {
    // Set user info here
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');

    if (params.matchId) {
      (async () => {
        fetchMatch({ variables: { matchId: params.matchId } });
        console.log('Got Match', data?.getMatch?.data);
        if (data?.getMatch?.data) {
          setStateGetMatchData(data.getMatch.data);
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
          {/* My Players  */}
          <TeamPlayers teamPlayers={teamAPlayers} />
          {/* Oponent Round Runner  */}
          <RoundRunner />
          <NetScoreOfRound />
          {/* My Round Runner */}
          <RoundRunner />
          {/* Oponent Players  */}
          <TeamPlayers teamPlayers={teamBPlayers} />
        </div>
      </Suspense>
    </>
  );
}

export default MatchPage;
