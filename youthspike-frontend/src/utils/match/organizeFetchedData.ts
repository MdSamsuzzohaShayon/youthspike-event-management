import { setEventSponsors } from "@/redux/slices/eventSlice";
import { setAvailablePlayers, setMatchInfo, setMyPlayers, setMyTeam, setOpPlayers, setOpTeam, setTeamE, setTeamProcess } from "@/redux/slices/matchesSlice";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import { setTeamAPlayers, setTeamBPlayers } from "@/redux/slices/playerSlice";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { setTeamA, setTeamB } from "@/redux/slices/teamSlice";
import { store } from "@/redux/store";
import { IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, IUser } from "@/types";
import { EActionProcess } from "@/types/elements";
import { ETeam } from "@/types/team";

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
    let reformatAPlayers: IPlayer[] = [], reformatBPlayers: IPlayer[] = [];
    if (teamAF.players) {
      reformatAPlayers = teamAF.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamAF._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
     dispatch(setTeamAPlayers(reformatAPlayers));
    }
    if (teamBF.players) {
      reformatBPlayers = teamBF.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamBF._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
     dispatch(setTeamBPlayers(reformatBPlayers));
    }

    // Setting event
    /*
    if(event){
     dispatch(setCurrentEventInfo({
        _id: event._id,
        name: event.normalize,
        startDate: string;
        endDate: string;
        playerLimit: number;
        active: boolean;
        sponsors: string[];
      }));
    }
    */

    // Event Sponsors
   dispatch(setEventSponsors(event.sponsors));

    // Setting Rounds
    const formattedRounds: IRoundRelatives[] = [];
    const formattedNets: INetRelatives[] = [];
    for (const round of rounds) {
      const playerIds = round.players ? round.players.map((r) => r._id) : [];
      const subIds = round.subs ? round.subs.map((r) => r._id) : [];
      const roundObj: IRoundRelatives = { 
        _id: round._id, num: round.num, nets: [], players: playerIds, subs: subIds, 
        match: matchId, teamAProcess: round.teamAProcess, teamAScore: round.teamAScore, 
        teamBProcess: round.teamBProcess, teamBScore: round.teamBScore, firstPlacing: round.firstPlacing };

      // Setting Nets of a round
      if (round.nets && round.nets.length > 0) {
        const netIds: string[] = [];
        for (const n of round.nets) {
          netIds.push(n._id);
          formattedNets.push({
            _id: n._id, num: n.num, points: n.points, teamAScore: n.teamAScore, teamBScore: n.teamBScore, pairRange: n.pairRange, round: round._id,
            teamAPlayerA: n.teamAPlayerA, teamAPlayerB: n.teamAPlayerB, teamBPlayerA: n.teamBPlayerA, teamBPlayerB: n.teamBPlayerB, 
          });
        }
        roundObj.nets = netIds;
      }
      formattedRounds.push(roundObj);
    }

   dispatch(setNets(formattedNets));
   dispatch(setRoundList(formattedRounds));
    if (formattedRounds.length > 0) {
     dispatch(setCurrentRound(formattedRounds[0]));
    }

    if (formattedNets.length > 0 && formattedRounds.length > 0) {
      const filteredNets = formattedNets.filter((net) => net.round === formattedRounds[0]._id);
     dispatch(setCurrentRoundNets(filteredNets));
    }

    // Setting room
    if (!token || !userInfo) {
      // @ts-ignore
     dispatch(setCurrentRoom({ _id: matchData.room._id, match: _id, round: formattedRounds[0]._id, teamA: teamAF?._id ? teamAF._id : null, teamAClient: null, teamAProcess: formattedRounds[0].teamAProcess, teamB: teamBF?._id ? teamBF?._id : null, teamBClient: null, teamBProcess: formattedRounds[0].teamBProcess }))
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
        rounds: [...rounds.map(r => r._id)],
        netVariance: matchData.netVariance
      }),
    );


    // Setting variables for team A and team B
    if (userInfo && userInfo.captainplayer === teamAF?.captain?._id) {
     dispatch(setMyTeam(teamAF));
     dispatch(setOpTeam(teamBF));
     dispatch(setMyPlayers(reformatAPlayers));
     dispatch(setOpPlayers(reformatBPlayers));
     dispatch(setTeamE({ myTeamE: ETeam.teamA, opTeamE: ETeam.teamB }));
     dispatch(setAvailablePlayers(reformatAPlayers.map((p)=> p._id)));
      if (rounds && rounds.length > 0) {
        let myTeamProcess = rounds[0].teamAProcess;
        let opTeamProcess = rounds[0].teamBProcess;
        if (opTeamProcess === EActionProcess.LINEUP) {
          myTeamProcess = EActionProcess.CHECKIN;
        }
        // @ts-ignore
       dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      }
    } else {
     dispatch(setMyTeam(teamBF));
     dispatch(setOpTeam(teamAF));
     dispatch(setMyPlayers(reformatBPlayers));
     dispatch(setOpPlayers(reformatAPlayers));
     dispatch(setAvailablePlayers(reformatBPlayers.map((p)=> p._id)));
      if (rounds && rounds.length > 0) {
        let myTeamProcess = rounds[0].teamBProcess;
        let opTeamProcess = rounds[0].teamAProcess;
        if (opTeamProcess === EActionProcess.LINEUP) {
          myTeamProcess = EActionProcess.CHECKIN;
        }
        // @ts-ignore
       dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      }
    }
  };

  export default organizeFetchedData;
