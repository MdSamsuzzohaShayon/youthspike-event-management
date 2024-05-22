import React from 'react';
import { setCurrentEventInfo, setEventSponsors, setLdo } from '@/redux/slices/eventSlice';
import { setAvailablePlayers, setMatchInfo, setMyPlayers, setMyTeam, setOpPlayers, setOpTeam, setTeamE } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setTeamAPlayers, setTeamBPlayers } from '@/redux/slices/playerSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { setTeamA, setTeamB } from '@/redux/slices/teamSlice';
import { IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, IUser } from '@/types';
// import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { getMatch } from '../localStorage';
import { APP_NAME } from '../keys';

interface IOrganizeFetchedDataProps {
  matchData: IMatchExpRel;
  token: string | null;
  userInfo: IUser | null;
  matchId: string;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
};

const organizeFetchedData = ({ matchData, token, userInfo, matchId, dispatch }: IOrganizeFetchedDataProps): void => {
  const { _id, description, numberOfNets, numberOfRounds, teamA: teamAF, teamB: teamBF, date, rounds, event, completed, fwango, room, netVariance } = matchData;

  // Setting teams
  dispatch(setTeamA({ ...teamAF }));
  dispatch(setTeamB({ ...teamBF }));

  // Setting players
  const reformatPlayers = (players: IPlayer[] | undefined, teamId: string) => {
    if (!players) return [];
    return players.map((player) => ({
      ...player,
      teams: [teamId],
      event: event?._id,
      profile: player.profile,
    }));
  };

  const teamAPlayers = reformatPlayers(teamAF?.players, teamAF?._id || '');
  const teamBPlayers = reformatPlayers(teamBF?.players, teamBF?._id || '');

  dispatch(setTeamAPlayers(teamAPlayers));
  dispatch(setTeamBPlayers(teamBPlayers));

  // Setting event
  if (event) {
    dispatch(setCurrentEventInfo(event));
    if (event.ldo) {
      dispatch(setLdo(event.ldo));
    }
    const defaultSponsor = {
      _id: 'default-sponsor-id',
      company: APP_NAME,
      logo: 'free-logo.png',
    };
    dispatch(setEventSponsors([defaultSponsor, ...event.sponsors]));
  }

  // Setting Rounds
  const formattedRounds: IRoundRelatives[] = [];
  const formattedNets: INetRelatives[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const round of rounds) {
    const { _id: roundId, players, subs, ...restRound } = round;
    const playerIds = players ? players.map((p) => p._id) : [];
    const subIds = subs ? subs.map((s) => s._id) : [];
    const roundObj: IRoundRelatives = {
      _id: roundId,
      players: playerIds,
      subs: subIds,
      match: matchId,
      ...restRound,
    };

    // Setting Nets of a round
    if (round.nets && round.nets.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const net of round.nets) {
        const { _id: netId, ...netProps } = net;
        formattedNets.push({ _id: netId, round: roundId, ...netProps });
      }
      roundObj.nets = round.nets.map((n) => n._id);
    }
    formattedRounds.push(roundObj);
  }

  dispatch(setNets(formattedNets));
  dispatch(setRoundList(formattedRounds));

  // Setting current round and nets
  let selectedRound = formattedRounds[0];
  if (formattedRounds.length > 0) {
    const matchRound = getMatch(matchData._id);
    const foundRound = formattedRounds.find((fr) => fr._id === (matchRound?.roundId || ''));
    if (foundRound) selectedRound = foundRound;
    dispatch(setCurrentRound(selectedRound));

    const filteredNets = formattedNets.filter((net) => net.round === selectedRound._id);
    dispatch(setCurrentRoundNets(filteredNets));
  }

  // Setting room
  if (!token || !userInfo) {
    dispatch(
      setCurrentRoom({
        _id: room._id,
        match: _id,
        rounds: formattedRounds[0]._id,
        teamA: teamAF?._id || null,
        teamAClient: null,
        teamAProcess: formattedRounds[0].teamAProcess,
        teamB: teamBF?._id || null,
        teamBClient: null,
        teamBProcess: formattedRounds[0].teamBProcess,
      }),
    );
  }

  // Setting Match
  dispatch(
    setMatchInfo({
      _id,
      date,
      completed,
      description,
      numberOfNets,
      numberOfRounds,
      fwango,
      teamA: teamAF._id,
      teamB: teamBF._id,
      event: event?._id,
      rounds: rounds.map((r) => r._id),
      netVariance,
    }),
  );

  // Setting variables for team A and team B
  const isTeamACaptain = userInfo?.captainplayer === teamAF?.captain?._id || userInfo?.cocaptainplayer === teamAF?.cocaptain?._id;

  if (isTeamACaptain) {
    dispatch(setMyTeam(teamAF));
    dispatch(setOpTeam(teamBF));
    dispatch(setMyPlayers(teamAPlayers));
    dispatch(setOpPlayers(teamBPlayers));
    dispatch(setTeamE({ myTeamE: ETeam.teamA, opTeamE: ETeam.teamB }));
    dispatch(setAvailablePlayers(teamAPlayers.map((p) => p._id)));
  } else {
    dispatch(setMyTeam(teamBF));
    dispatch(setOpTeam(teamAF));
    dispatch(setMyPlayers(teamBPlayers));
    dispatch(setOpPlayers(teamAPlayers));
    dispatch(setAvailablePlayers(teamBPlayers.map((p) => p._id)));
  }
};

export default organizeFetchedData;

