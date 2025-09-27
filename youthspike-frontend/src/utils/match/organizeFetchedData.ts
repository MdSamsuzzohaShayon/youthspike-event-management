import React from "react";
import {
  setCurrentEventInfo,
  setEventSponsors,
  setLdo,
} from "@/redux/slices/eventSlice";
import {
  setAvailablePlayers,
  setMatchInfo,
  setMyPlayers,
  setMyTeam,
  setOpPlayers,
  setOpTeam,
  setTeamE,
} from "@/redux/slices/matchesSlice";
import {
  setCurrentRoundNets,
  setCurrNetNum,
  setNets,
} from "@/redux/slices/netSlice";
import { setTeamAPlayers, setTeamBPlayers } from "@/redux/slices/playerSlice";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import {
  setTeamAPlayerRanking,
  setTeamBPlayerRanking,
} from "@/redux/slices/playerRankingSlice";
import { UserRole } from "@/types/user";
import { setTeamA, setTeamB } from "@/redux/slices/teamSlice";
import {
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IUser,
  ITeam,
  EServerPositionPair,
} from "@/types";
import LocalStorageService from "../LocalStorageService";
// import { EActionProcess } from '@/types/room';
import { ETeam } from "@/types/team";
import { APP_NAME } from "../keys";
import {
  setCurrentServerReceiver,
  setServerReceiverPlays,
  setServerReceiversOnNet,
} from "@/redux/slices/serverReceiverOnNetSlice";

interface IOrganizeFetchedDataProps {
  matchData: IMatchExpRel;
  token: string | null;
  userInfo: IUser | null;
  matchId: string;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
}

interface ITeamDispatchProps {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  myLocalTeam: ITeam;
  opLocalTeam: ITeam;
  myLocalPlayers: IPlayer[];
  opLocalPlayers: IPlayer[];
  myLocalTeamE: ETeam;
  opLocalTeamE: ETeam;
}

// Helper function to handle dispatching team data
const dispatchTeamData = ({
  dispatch,
  myLocalTeam,
  opLocalTeam,
  myLocalPlayers,
  opLocalPlayers,
  myLocalTeamE,
  opLocalTeamE,
}: ITeamDispatchProps) => {
  dispatch(setMyTeam(myLocalTeam));
  dispatch(setOpTeam(opLocalTeam));
  dispatch(setMyPlayers(myLocalPlayers));
  dispatch(setOpPlayers(opLocalPlayers));
  dispatch(setTeamE({ myTeamE: myLocalTeamE, opTeamE: opLocalTeamE }));
  dispatch(setAvailablePlayers(myLocalPlayers.map((p) => p._id)));
};

const organizeFetchedData = async ({
  matchData,
  token,
  userInfo,
  matchId,
  dispatch,
}: IOrganizeFetchedDataProps): Promise<void> => {
  const {
    _id,
    description,
    location,
    numberOfNets,
    numberOfRounds,
    teamA: teamAF,
    teamB: teamBF,
    date,
    rounds,
    event,
    completed,
    tieBreaking,
    fwango,
    room,
    netVariance,
    extendedOvertime,
    teamARanking,
    teamBRanking,
    serverReceiverOnNet, // Bound to net
    serverReceiverSinglePlay,
  } = matchData;

  const CURRENT_NET_NUM = 1;

  // Setting teams
  dispatch(setTeamA({ ...teamAF }));
  dispatch(setTeamB({ ...teamBF }));

  // Setting ranking
  if (teamARanking) dispatch(setTeamAPlayerRanking(teamARanking));
  if (teamBRanking) dispatch(setTeamBPlayerRanking(teamBRanking));

  const teamAPlayersRanking = new Set(
    teamARanking?.rankings.map((r) =>
      typeof r.player === "object" ? r.player._id : r.player
    )
  );
  const teamBPlayersRanking = new Set(
    teamBRanking?.rankings.map((r) =>
      typeof r.player === "object" ? r.player._id : r.player
    )
  );

  // Setting players
  const reformatPlayers = (team: ITeam, pr: Set<string>) => {
    if (!team.players && !team.moved) return [];
    const movedIds = new Set();
    let pl = [...team.players];
    if (team.moved) {
      team.moved.forEach((p) => movedIds.add(p._id));
      pl = [...team.moved.filter((mp) => pr.has(mp._id)), ...team.players];
    }

    return pl.map((player) => ({
      ...player,
      teams: movedIds.has(player._id) ? [] : [team._id],
      event: event?._id,
      profile: player.profile,
    }));
  };

  const teamAPlayers = reformatPlayers(teamAF, teamAPlayersRanking);
  const teamBPlayers = reformatPlayers(teamBF, teamBPlayersRanking);

  dispatch(setTeamAPlayers(teamAPlayers));
  dispatch(setTeamBPlayers(teamBPlayers));

  // Setting event
  if (event) {
    const eventObj = { ...event, matches: [matchId] };
    dispatch(setCurrentEventInfo(eventObj));
    if (event.ldo) {
      dispatch(setLdo(event.ldo));
    }
    const defaultSponsor = {
      _id: "default-sponsor-id",
      company: APP_NAME,
      logo: "free-logo.png",
    };
    dispatch(setEventSponsors([defaultSponsor, ...event.sponsors]));
  }

  // Setting Rounds
  const formattedRounds: IRoundRelatives[] = [];
  const formattedNets: INetRelatives[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const round of rounds) {
    const { _id: roundId, players, subs, match: _, ...restRound } = round;
    const playerIds = players ? players.map((p) => p._id) : [];
    const subIds = subs ? subs.map((s) => s._id) : [];

    // @ts-ignore
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
        // @ts-ignore
        formattedNets.push({ _id: netId, round: roundId, ...netProps });
      }
      roundObj.nets = round.nets.map((n) => n._id);
    }
    formattedRounds.push(roundObj);
  }

  // Set all nets and rounds
  dispatch(setNets(formattedNets));
  dispatch(setRoundList(formattedRounds));

  let currNetNum = CURRENT_NET_NUM;
  // Setting current round and nets
  let selectedRound = formattedRounds[0];
  if (formattedRounds.length > 0) {
    const matchRound = LocalStorageService.getMatch(matchData._id);
    if (matchRound && matchRound.netId) {
      const currNet = formattedNets.find((n) => n._id === matchRound.netId);
      if (currNet?.num) currNetNum = currNet?.num;
    }
    const foundRound = formattedRounds.find(
      (fr) => fr._id === (matchRound?.roundId || "")
    );
    if (foundRound) {
      selectedRound = foundRound;
    } else {
      // Set default round
      LocalStorageService.setMatch(_id, selectedRound._id);
    }
    dispatch(setCurrentRound(selectedRound));

    const filteredNets = formattedNets.filter(
      (net) => net.round === selectedRound._id
    );
    dispatch(setCurrentRoundNets(filteredNets));

    const formattedNetsServerReceiver = serverReceiverOnNet?.map((sr) => ({
      ...sr,
      match:
        sr.matchId || (typeof sr.match === "string" ? sr.match : sr.match?._id),
      net: sr.netId || (typeof sr.net === "string" ? sr.net : sr.net?._id),
      receiver:
        sr.receiverId ||
        (typeof sr.receiver === "string" ? sr.receiver : sr.receiver?._id) ||
        null,
      receivingPartner:
        sr.receivingPartnerId ||
        (typeof sr.receivingPartner === "string"
          ? sr.receivingPartner
          : sr.receivingPartner?._id) ||
        null,
      round:
        sr.roundId || (typeof sr.round === "string" ? sr.round : sr.round?._id),
      server:
        sr.serverId ||
        (typeof sr.server === "string" ? sr.server : sr.server?._id) ||
        null,
      servingPartner:
        sr.servingPartnerId ||
        (typeof sr.servingPartner === "string"
          ? sr.servingPartner
          : sr.servingPartner?._id) ||
        null,
    }));

    const formattedServerReceiverSinglePlays = serverReceiverSinglePlay?.map(
      (sr) => ({
        ...sr,
        match:
          sr.matchId ||
          (typeof sr.match === "string" ? sr.match : sr.match?._id),
        net: sr.netId || (typeof sr.net === "string" ? sr.net : sr.net?._id),
        receiver:
          sr.receiverId ||
          (typeof sr.receiver === "string" ? sr.receiver : sr.receiver?._id) ||
          null,
        receivingPartner:
          sr.receivingPartnerId ||
          (typeof sr.receivingPartner === "string"
            ? sr.receivingPartner
            : sr.receivingPartner?._id) ||
          null,
        server:
          sr.serverId ||
          (typeof sr.server === "string" ? sr.server : sr.server?._id) ||
          null,
        servingPartner:
          sr.servingPartnerId ||
          (typeof sr.servingPartner === "string"
            ? sr.servingPartner
            : sr.servingPartner?._id) ||
          null,
      })
    );

    if (formattedNetsServerReceiver) dispatch(setServerReceiversOnNet(formattedNetsServerReceiver));

    if (formattedServerReceiverSinglePlays)
      dispatch(setServerReceiverPlays(formattedServerReceiverSinglePlays));

    const selectedNet = filteredNets.find((n) => n.num === currNetNum);
    if (selectedNet) {
      const currServerReceiver = formattedNetsServerReceiver?.find(
        (sr) => sr.netId === selectedNet._id || sr.net === selectedNet._id
      );
      if (currServerReceiver) {
        
        dispatch(setCurrentServerReceiver(currServerReceiver));
      } else {
        dispatch(setCurrentServerReceiver({
          match: matchData._id,
          matchId: matchData._id,
          mutate: 0,
          play: 0,
          net: selectedNet._id,
          netId: selectedNet._id,
          server: null,
          receiver: null,
          receivingPartner: null,
          servingPartner: null,
          serverId: null,
          receiverId: null,
          receivingPartnerId: null,
          servingPartnerId: null,
          room: room._id,
          round: selectedRound._id,
          roundId: selectedRound._id,
          serverPositionPair: EServerPositionPair.PAIR_A_LEFT,
          teamAScore: 0,
          teamBScore: 0,
        }));
      }
    }
  }

  // Current net
  dispatch(setCurrNetNum(currNetNum));

  // Setting room
  dispatch(
    setCurrentRoom({
      _id: room._id,
      match: _id,
      rounds: formattedRounds.map((r) => ({
        _id: r._id,
        teamAProcess: r.teamAProcess,
        teamBProcess: r.teamBProcess,
      })), // [{_id, teamAProcess, teamBProcess}]
      teamA: teamAF?._id || null,
      teamAClient: null,
      // teamAProcess: selectedRound.teamAProcess,
      teamB: teamBF?._id || null,
      teamBClient: null,
      // teamBProcess: selectedRound.teamBProcess,
    })
  );

  // Setting Match
  const matchObj = {
    _id,
    date,
    completed,
    description,
    location,
    numberOfNets,
    numberOfRounds,
    fwango,
    teamA: teamAF._id,
    teamB: teamBF._id,
    event: event?._id,
    rounds: rounds.map((r) => r._id),
    netVariance,
    tieBreaking,
    extendedOvertime,
  };
  dispatch(setMatchInfo(matchObj));
  // console.log('Match info: ', matchObj);

  // Setting variables for team A and team B

  // Main logic
  const isAdminDirector =
    userInfo?.role === UserRole.admin || userInfo?.role === UserRole.director;
  const selectedTeam = await LocalStorageService.getLocalTeam();
  const isTeamACaptain =
    userInfo?.captainplayer === teamAF?.captain?._id ||
    userInfo?.cocaptainplayer === teamAF?.cocaptain?._id;

  if (isAdminDirector && selectedTeam) {
    if (selectedTeam === ETeam.teamA) {
      // @ts-ignore
      dispatchTeamData({
        dispatch,
        myLocalTeam: teamAF,
        opLocalTeam: teamBF,
        myLocalPlayers: teamAPlayers,
        opLocalPlayers: teamBPlayers,
        myLocalTeamE: ETeam.teamA,
        opLocalTeamE: ETeam.teamB,
      });
    } else {
      // @ts-ignore
      dispatchTeamData({
        dispatch,
        myLocalTeam: teamBF,
        opLocalTeam: teamAF,
        myLocalPlayers: teamBPlayers,
        opLocalPlayers: teamAPlayers,
        myLocalTeamE: ETeam.teamB,
        opLocalTeamE: ETeam.teamA,
      });
    }
  } else if (isTeamACaptain) {
    // @ts-ignore
    dispatchTeamData({
      dispatch,
      myLocalTeam: teamAF,
      opLocalTeam: teamBF,
      myLocalPlayers: teamAPlayers,
      opLocalPlayers: teamBPlayers,
      myLocalTeamE: ETeam.teamA,
      opLocalTeamE: ETeam.teamB,
    });
  } else {
    // @ts-ignore
    dispatchTeamData({
      dispatch,
      myLocalTeam: teamBF,
      opLocalTeam: teamAF,
      myLocalPlayers: teamBPlayers,
      opLocalPlayers: teamAPlayers,
      myLocalTeamE: ETeam.teamB,
      opLocalTeamE: ETeam.teamA,
    });
  }
};

export default organizeFetchedData;
