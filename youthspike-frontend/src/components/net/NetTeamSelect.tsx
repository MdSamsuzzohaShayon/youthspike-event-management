// NetTeamSelect.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { IPlayer } from '@/types';
import { ETeam } from '@/types/team';
import { calcPairScore } from '@/utils/scoreCalc';
import { ETeamPlayer, INetRelatives, INetUpdate } from '@/types/net';
import { EXTRA_HEIGHT } from '@/utils/constant';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { border } from '@/utils/styles';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setDisabledPlayerIds, setOutOfRange, setPlayerSpot, setPrevPartner, setSelectedNet, setShowTeamPlayers } from '@/redux/slices/matchesSlice';
import { EActionProcess } from '@/types/room';
import findPrevPartner from '@/utils/match/findPrevPartner';
import findOutOfRange from '@/utils/match/findOutOfRange';

import PlayerScoreCard from '../player/PlayerScoreCard';

interface INetTeamSelectProps {
  teamE: ETeam;
  net: INetRelatives | null;
  onTop: boolean;
  boardHeight: number;
}

function NetTeamSelect({ teamE, net, onTop, boardHeight }: INetTeamSelectProps) {
  const user = useUser();
  const dispatch = useAppDispatch();

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const { disabledPlayerIds, match: currMatch, myPlayers, opPlayers, myTeamE } = useAppSelector((state) => state.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

  // Local State
  const [playerA, setPlayerA] = useState<null | IPlayer>(null);
  const [playerB, setPlayerB] = useState<null | IPlayer>(null);
  const [playerARank, setPlayerARank] = useState<null | number>(null);
  const [playerBRank, setPlayerBRank] = useState<null | number>(null);
  const [pairScore, setPairScore] = useState<number | null>(null);

  const handleEvacuatePlayer = (playerSpot: ETeamPlayer) => {
    if (!user.token || !user.info) return;
    /**
     * Delete a player from the net
     * team a player 1 = 1, team a player 2 = 2, team b player 1 = 3, team b player 2 = 4
     */
    if (!net || !net._id || !net.round) return;
    let evacuatedPlayerId: string | null | undefined = null;

    const netPlayerObj: INetUpdate = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA ? net.teamAPlayerA : null,
      teamAPlayerB: net.teamAPlayerB ? net.teamAPlayerB : null,
      teamBPlayerA: net.teamBPlayerA ? net.teamBPlayerA : null,
      teamBPlayerB: net.teamBPlayerB ? net.teamBPlayerB : null,
    };

    if (playerSpot === ETeamPlayer.PLAYER_A) {
      if (myTeamE === ETeam.teamA) {
        evacuatedPlayerId = netPlayerObj.teamAPlayerA;
        netPlayerObj.teamAPlayerA = null;
      } else {
        evacuatedPlayerId = netPlayerObj.teamBPlayerA;
        netPlayerObj.teamBPlayerA = null;
      }
    } else if (playerSpot === ETeamPlayer.PLAYER_B) {
      if (myTeamE === ETeam.teamA) {
        evacuatedPlayerId = netPlayerObj.teamAPlayerB;
        netPlayerObj.teamAPlayerB = null;
      } else {
        evacuatedPlayerId = netPlayerObj.teamBPlayerB;
        netPlayerObj.teamBPlayerB = null;
      }
    }

    // Set current round nets and all nets
    const updatedCRN = [...currRoundNets]; // crn = current round nets
    const updatedAllNets = [...allNets];
    const findCRN = updatedCRN.findIndex((n) => n._id === net._id);
    if (findCRN !== -1) updatedCRN[findCRN] = { ...updatedCRN[findCRN], ...netPlayerObj };
    const findAN = updatedAllNets.findIndex((n) => n._id === net._id);
    if (findAN !== -1) updatedAllNets[findAN] = { ...updatedAllNets[findAN], ...netPlayerObj };

    // ===== Update Nets, Disabled Player, Show Team Player, Out of range =====
    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));
    dispatch(setDisabledPlayerIds([...disabledPlayerIds.filter((dp) => dp !== evacuatedPlayerId)]));
    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  };

  const handleDropdownPlayer = (e: React.SyntheticEvent, playerSpot: ETeamPlayer) => {
    /**
     * Show list of available player
     * Remove players from subs of the rounds
     * Remove players who is already selected on another net
     * Remove players who had been palyed with same player in the previous round
     */
    e.preventDefault();
    if (!user.token || !user.info || !currRound) return;

    // Process for the round must be checkin or lineup
    let isTeamProcessValid = false;
    if (myTeamE === ETeam.teamA) {
      if (currRound?.teamAProcess === EActionProcess.CHECKIN && (currRound?.teamBProcess === EActionProcess.CHECKIN || currRound?.teamBProcess === EActionProcess.LINEUP)) {
        isTeamProcessValid = true;
      }
    } else if (currRound?.teamBProcess === EActionProcess.CHECKIN && (currRound?.teamAProcess === EActionProcess.CHECKIN || currRound?.teamAProcess === EActionProcess.LINEUP)) {
      isTeamProcessValid = true;
    }

    if (!isTeamProcessValid) return;

    // At first first placing their player first will submit their players
    if (myTeamE === currRound?.firstPlacing) {
      if (myTeamE === ETeam.teamA) {
        if (currRound.teamAProcess === EActionProcess.LINEUP) return;
      } else if (currRound.teamBProcess === EActionProcess.LINEUP) return;
    } else if (myTeamE === ETeam.teamA) {
      if (currRound.teamBProcess !== EActionProcess.LINEUP) return;
    } else if (currRound.teamAProcess !== EActionProcess.LINEUP) return;

    dispatch(setShowTeamPlayers(true));
    dispatch(setPlayerSpot(playerSpot));
    if (net) dispatch(setSelectedNet(net));

    // Disabled players who played with him in previous round
    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net });
    // eslint-disable-next-line no-unused-expressions
    prevPartnerId ? dispatch(setPrevPartner(prevPartnerId)) : dispatch(setPrevPartner(null));

    // Disable players according to met variance
    const inavalidPlayerIds = findOutOfRange({ currMatch, net, myPlayers, myTeamE, opPlayers, playerSpot, teamAPlayerRanking, teamBPlayerRanking });
    if (inavalidPlayerIds.length > 0) dispatch(setOutOfRange(inavalidPlayerIds));
  };

  const matchTPlayer = useCallback(
    (teamPlayer: ETeamPlayer, isMyTeam: boolean): null | IPlayer => {
      if (!net || !net.round || !net._id) return null;

      // Assign team players based on teamE and isMyTeam
      const isTeamA = teamE === ETeam.teamA;

      const myPlayerA = isMyTeam === isTeamA ? net.teamAPlayerA : net.teamBPlayerA;
      const myPlayerB = isMyTeam === isTeamA ? net.teamAPlayerB : net.teamBPlayerB;
      const opPlayerA = isMyTeam === isTeamA ? net.teamBPlayerA : net.teamAPlayerA;
      const opPlayerB = isMyTeam === isTeamA ? net.teamBPlayerB : net.teamAPlayerB;

      // Determine the expected player based on teamPlayer and isMyTeam
      const playerMap = {
        [ETeamPlayer.PLAYER_A]: isMyTeam ? myPlayerA : opPlayerA,
        [ETeamPlayer.PLAYER_B]: isMyTeam ? myPlayerB : opPlayerB,
      };

      const playerList = isMyTeam ? myPlayers : opPlayers;
      const expectedPlayer = playerMap[teamPlayer] ? playerList.find((p) => p._id === playerMap[teamPlayer]) : null;

      return expectedPlayer || null;
    },
    [myPlayers, net, opPlayers, teamE]
  );


  useEffect(() => {
    const pA = matchTPlayer(ETeamPlayer.PLAYER_A, !onTop);
    const pB = matchTPlayer(ETeamPlayer.PLAYER_B, !onTop);

    setPlayerA(pA);
    setPlayerB(pB);

    const rankings = teamAPlayerRanking && teamBPlayerRanking ? [...teamAPlayerRanking.rankings, ...teamBPlayerRanking.rankings] : [];
    const pARank = rankings.find((p) => p.player._id === pA?._id)?.rank || null;
    const pBRank = rankings.find((p) => p.player._id === pB?._id)?.rank || null;

    setPlayerARank(pARank);
    setPlayerBRank(pBRank);

    const score = calcPairScore(pARank, pBRank);
    setPairScore(score);
  }, [matchTPlayer, onTop, teamAPlayerRanking, teamBPlayerRanking]);

  // http://localhost:3001/matches/66fadc13002cfc571836844a

  return (
    <div
      style={{ minHeight: `${boardHeight / 2 + EXTRA_HEIGHT / 2}px` }}
      className={`net-top w-full px-2 text-center flex ${onTop ? 'flex-col bg-gradient-dark text-white' : 'flex-col-reverse bg-white text-black-logo'} border ${border.light
        } items-center justify-start`}
    >
      <div className="player-pair flex justify-between w-full gap-x-1">
        <div className="player-card team-a-player-1 w-3/6 lg:w-2/6">
          <PlayerScoreCard
            onTop={onTop}
            teamPlayer={ETeamPlayer.PLAYER_A}
            player={playerA}
            playerRankExist={playerARank}
            dropdownPlayer={handleDropdownPlayer}
            evacuatePlayer={handleEvacuatePlayer}
            screenWidth={screenWidth}
            myTeamE={myTeamE}
          />
        </div>
        <div className="player-card team-b-player-2 w-3/6 lg:w-2/6">
          <PlayerScoreCard
            onTop={onTop}
            teamPlayer={ETeamPlayer.PLAYER_B}
            player={playerB}
            playerRankExist={playerBRank}
            dropdownPlayer={handleDropdownPlayer}
            evacuatePlayer={handleEvacuatePlayer}
            screenWidth={screenWidth}
            myTeamE={myTeamE}
          />
        </div>
      </div>

      <div className="pair-score mt-2">
        <span className="font-bold">{`Pair Score: ${pairScore || 'N/A'}`}</span>
      </div>
    </div>
  );
}

export default NetTeamSelect;
