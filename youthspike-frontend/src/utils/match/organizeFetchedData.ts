import { setCurrentEventInfo, setEventSponsors, setLdo } from '@/redux/slices/eventSlice';
import { setAvailablePlayers, setMatchInfo, setMyPlayers, setMyTeam, setOpPlayers, setOpTeam, setTeamE } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setTeamAPlayers, setTeamBPlayers } from '@/redux/slices/playerSlice';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { setTeamA, setTeamB } from '@/redux/slices/teamSlice';
import { IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, IUser } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { getMatch } from '../localStorage';

/**
 * Set initial state for current match
 */
const organizeFetchedData = (matchData: IMatchExpRel, token: string | null, userInfo: IUser | null, matchId: string, dispatch: React.Dispatch<React.ReducerAction<any>>) => {
  /**
   * Setting data as state of redux that is fetched from backend using GraphAL
   * Set action box values
   */

  const { _id, location, numberOfNets, numberOfRounds, teamA: teamAF, teamB: teamBF, date, rounds, event } = matchData;

  // Setting teams
  dispatch(setTeamA({ ...teamAF }));
  dispatch(setTeamB({ ...teamBF }));

  // Setting players
  let reformatAPlayers: IPlayer[] = [];
  let reformatBPlayers: IPlayer[] = [];
  if (teamAF.players) {
    reformatAPlayers = teamAF.players.map((player: IPlayer) => {
      const newPlayer: IPlayer = {
        _id: player._id,
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        status: player.status,
        rank: player.rank,
        team: teamAF._id,
        event: event._id,
        captainofteams: player.captainofteams,
        profile: player.profile,
      };
      return newPlayer;
    });
    dispatch(setTeamAPlayers(reformatAPlayers));
  }
  if (teamBF.players) {
    reformatBPlayers = teamBF.players.map((player: IPlayer) => {
      const newPlayer: IPlayer = {
        _id: player._id,
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        status: player.status,
        rank: player.rank,
        team: teamBF._id,
        event: event._id,
        captainofteams: player.captainofteams,
        profile: player.profile,
      };
      return newPlayer;
    });
    dispatch(setTeamBPlayers(reformatBPlayers));
  }

  // Setting event
  if (event) {
    dispatch(setCurrentEventInfo(event));
  }

  // setting ldo
  if (event?.ldo) {
    dispatch(setLdo(event.ldo));
  }

  // Event Sponsors
  dispatch(setEventSponsors(event.sponsors));

  // Setting Rounds
  const formattedRounds: IRoundRelatives[] = [];
  const formattedNets: INetRelatives[] = [];

  for (let i = 0; i < rounds.length; i += 1) {
    const round = rounds[i];
    const playerIds = round.players ? round.players.map((r) => r._id) : [];
    const subIds = round.subs ? round.subs.map((r) => r._id) : [];
    const roundObj: IRoundRelatives = {
      _id: round._id,
      num: round.num,
      completed: round.completed,
      nets: [],
      players: playerIds,
      subs: subIds,
      match: matchId,
      teamAProcess: round.teamAProcess,
      teamAScore: round.teamAScore,
      teamBProcess: round.teamBProcess,
      teamBScore: round.teamBScore,
      firstPlacing: round.firstPlacing,
    };

    // Setting Nets of a round
    if (round.nets && round.nets.length > 0) {
      const netIds: string[] = [];
      for (let nI = 0; nI < round.nets.length; nI += 1) {
        const n = round.nets[nI];
        netIds.push(n._id);
        formattedNets.push({
          _id: n._id,
          num: n.num,
          netType: n.netType,
          points: n.points,
          teamAScore: n.teamAScore,
          teamBScore: n.teamBScore,
          pairRange: n.pairRange,
          round: round._id,
          teamAPlayerA: n.teamAPlayerA,
          teamAPlayerB: n.teamAPlayerB,
          teamBPlayerA: n.teamBPlayerA,
          teamBPlayerB: n.teamBPlayerB,
        });
      }
      roundObj.nets = netIds;
    }
    formattedRounds.push(roundObj);
  }

  dispatch(setNets(formattedNets));
  dispatch(setRoundList(formattedRounds));
  let selectedRound = formattedRounds[0];
  if (formattedRounds.length > 0) {
    const matchRound = getMatch(matchData._id);
    if (matchRound) {
      const findRound = formattedRounds.find((fr) => fr._id === matchRound.roundId);
      if (findRound) selectedRound = findRound;
    }
    dispatch(setCurrentRound(selectedRound));
  }

  if (formattedNets.length > 0 && formattedRounds.length > 0) {
    const filteredNets = formattedNets.filter((net) => net.round === selectedRound._id);
    dispatch(setCurrentRoundNets(filteredNets));
  }

  // Setting room
  if (!token || !userInfo) {
    // @ts-ignore
    dispatch(
      setCurrentRoom({
        _id: matchData.room._id,
        match: _id,
        round: formattedRounds[0]._id,
        teamA: teamAF?._id ? teamAF._id : null,
        teamAClient: null,
        teamAProcess: formattedRounds[0].teamAProcess,
        teamB: teamBF?._id ? teamBF?._id : null,
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
      location,
      numberOfNets,
      numberOfRounds,
      teamA: teamAF._id,
      teamB: teamBF._id,
      event: event._id,
      rounds: [...rounds.map((r) => r._id)],
      netVariance: matchData.netVariance,
    }),
  );

  // Setting variables for team A and team B
  if (userInfo && (userInfo.captainplayer === teamAF?.captain?._id || userInfo.cocaptainplayer === teamAF?.cocaptain?._id)) {
    dispatch(setMyTeam(teamAF));
    dispatch(setOpTeam(teamBF));
    dispatch(setMyPlayers(reformatAPlayers));
    dispatch(setOpPlayers(reformatBPlayers));
    dispatch(setTeamE({ myTeamE: ETeam.teamA, opTeamE: ETeam.teamB }));
    dispatch(setAvailablePlayers(reformatAPlayers.map((p) => p._id)));
    if (rounds && rounds.length > 0) {
      let myTeamProcess = rounds[0].teamAProcess;
      const opTeamProcess = rounds[0].teamBProcess;
      if (opTeamProcess === EActionProcess.LINEUP) {
        myTeamProcess = EActionProcess.CHECKIN;
      }
    }
  } else {
    dispatch(setMyTeam(teamBF));
    dispatch(setOpTeam(teamAF));
    dispatch(setMyPlayers(reformatBPlayers));
    dispatch(setOpPlayers(reformatAPlayers));
    dispatch(setAvailablePlayers(reformatBPlayers.map((p) => p._id)));
    if (rounds && rounds.length > 0) {
      let myTeamProcess = rounds[0].teamBProcess;
      const opTeamProcess = rounds[0].teamAProcess;
      if (opTeamProcess === EActionProcess.LINEUP) {
        myTeamProcess = EActionProcess.CHECKIN;
      }
    }
  }
};

export default organizeFetchedData;
