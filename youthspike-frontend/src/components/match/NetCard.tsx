/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';

// Redux
import { setCurrNetNum, setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';

// Components

// Utils / libs / config
import { useUser } from '@/lib/UserProvider';

// Types
import { IPlayer, INetRelatives, INetUpdate } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { fsToggle } from '@/utils/helper';
import { setDisabledPlayerIds, setSelectedNet, setPlayerSpot, setShowTeamPlayers, setPrevPartner, setOutOfRange } from '@/redux/slices/matchesSlice';
import { ETeamPlayer } from '@/types/net';
import findOutOfRange from '@/utils/match/findOutOfRange';
import findPrevPartner from '@/utils/match/findPrevPartner';
import { EXTRA_HEIGHT } from '@/utils/constant';
import { border } from '@/utils/styles';
import { calcPairScore } from '@/utils/scoreCalc';

import NetPointCard from './NetPointCard';
import PlayerScoreCard from '../player/PlayerScoreCard';

interface INetCardProps {
  screenWidth: number;
  boardHeight: number;
  net: INetRelatives | null;
}

// Constant
const touchThreshold: number = 50;

function NetCard({ net, screenWidth, boardHeight }: INetCardProps) {
  // Hook
  const dispatch = useAppDispatch();
  const user = useUser();

  // Redux State
  const { currNetNum, currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamA } = useAppSelector((state) => state.teams);
  const { disabledPlayerIds, match: currMatch } = useAppSelector((state) => state.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

  // Local State
  const [startPosX, setStartPosX] = useState<number>(0);
  const [myPlayers, setMyPlayers] = useState<IPlayer[]>([]);
  const [opPlayers, setOpPlayers] = useState<IPlayer[]>([]); // Op = oponent
  const [myTeamE, setMyTeamE] = useState<ETeam>(ETeam.teamB);

  /**
   * Handle events
   */
  const handleRightShift = () => {
    const netIndex = currRoundNets.findIndex((n) => n.num === currNetNum);
    if (netIndex === null || netIndex === 0) return;
    const prevNet = currRoundNets[netIndex - 1];
    if (!prevNet) return;
    dispatch(setCurrNetNum(prevNet.num));
  };

  const handleLeftShift = () => {
    const netIndex = currRoundNets.findIndex((n) => n.num === currNetNum);
    if (netIndex === null || netIndex + 1 >= currRoundNets.length) return;
    const nextNet = currRoundNets[netIndex + 1];
    if (!nextNet) return;
    dispatch(setCurrNetNum(nextNet.num));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartPosX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const newEndPositionX = e.changedTouches[0].clientX;
    if (startPosX - newEndPositionX > touchThreshold) {
      handleLeftShift();
    } else if (newEndPositionX - startPosX > touchThreshold) {
      handleRightShift();
    }
  };

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

    if (playerSpot === ETeamPlayer.TA_PA || playerSpot === ETeamPlayer.TB_PA) {
      if (myTeamE === ETeam.teamA) {
        evacuatedPlayerId = netPlayerObj.teamAPlayerA;
        netPlayerObj.teamAPlayerA = null;
      } else {
        evacuatedPlayerId = netPlayerObj.teamBPlayerA;
        netPlayerObj.teamBPlayerA = null;
      }
    } else if (playerSpot === ETeamPlayer.TA_PB || playerSpot === ETeamPlayer.TB_PB) {
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

  useEffect(() => {
    if (!teamAPlayers || !teamBPlayers || !user) return;
    if (user.info && (user.info.captainplayer === teamA?.captain?._id || user.info.cocaptainplayer === teamA?.cocaptain?._id)) {
      setMyPlayers([...teamAPlayers]);
      setOpPlayers([...teamBPlayers]);
      setMyTeamE(ETeam.teamA);
    } else {
      setMyPlayers([...teamBPlayers]);
      setOpPlayers([...teamAPlayers]);
    }
  }, [teamAPlayers, teamBPlayers, user]);

  /**
   * Renders logically
   */
  const matchTPlayer = (teamPlayer: ETeamPlayer): null | IPlayer => {
    // tpNum = Team Player Number
    if (!net || !net.round || !net._id) return null;
    let expectedPlayer: IPlayer | null | undefined = null;

    let myPlayerA = net.teamBPlayerA;
    let myPlayerB = net.teamBPlayerB;
    let opPlayerA = net.teamAPlayerA;
    let opPlayerB = net.teamAPlayerB;
    if (myTeamE === ETeam.teamA) {
      myPlayerA = net.teamAPlayerA;
      myPlayerB = net.teamAPlayerB;
      opPlayerA = net.teamBPlayerA;
      opPlayerB = net.teamBPlayerB;
    }

    switch (teamPlayer) {
      case ETeamPlayer.TA_PA:
        expectedPlayer = opPlayers.find((p) => p._id === opPlayerA);
        break;
      case ETeamPlayer.TA_PB:
        expectedPlayer = opPlayers.find((p) => p._id === opPlayerB);
        break;
      case ETeamPlayer.TB_PA:
        expectedPlayer = myPlayers.find((p) => p._id === myPlayerA);
        break;
      case ETeamPlayer.TB_PB:
        expectedPlayer = myPlayers.find((p) => p._id === myPlayerB);
        break;

      default:
        break;
    }
    return expectedPlayer === undefined ? null : expectedPlayer;
  };

  const renderTeamSection = (TPA: ETeamPlayer, TPB: ETeamPlayer, onTop: boolean, refId: string): React.ReactNode => {
    const playerA = matchTPlayer(TPA);
    const playerB = matchTPlayer(TPB);

    const rankings = teamAPlayerRanking && teamBPlayerRanking ? [...teamAPlayerRanking.rankings, ...teamBPlayerRanking.rankings] : [];
    const playerARank = rankings.find((p) => p.player._id === playerA?._id)?.rank || null;
    const playerBRank = rankings.find((p) => p.player._id === playerB?._id)?.rank || null;

    const pairScore = calcPairScore(playerARank, playerBRank);
    return (
      <div
        id={refId}
        style={{ minHeight: `${boardHeight / 2 + EXTRA_HEIGHT / 2}px` }}
        className={`net-top w-full px-2 text-center flex ${onTop ? 'flex-col bg-gradient-dark text-white' : 'flex-col-reverse bg-white text-black-logo'} border ${
          border.light
        } items-center justify-start`}
      >
        <div className="player-pair flex justify-between w-full gap-x-1">
          <div className="player-card team-a-player-1 w-3/6 lg:w-2/6">
            <PlayerScoreCard
              onTop={onTop}
              teamPlayer={TPA}
              player={playerA}
              dropdownPlayer={handleDropdownPlayer}
              evacuatePlayer={handleEvacuatePlayer}
              screenWidth={screenWidth}
              myTeamE={myTeamE}
              tapr={teamAPlayerRanking}
              tbpr={teamBPlayerRanking}
            />
          </div>
          <div className="player-card team-a-player-2 w-3/6 lg:w-2/6">
            <PlayerScoreCard
              onTop={onTop}
              teamPlayer={TPB}
              player={playerB}
              dropdownPlayer={handleDropdownPlayer}
              evacuatePlayer={handleEvacuatePlayer}
              screenWidth={screenWidth}
              myTeamE={myTeamE}
              tapr={teamAPlayerRanking}
              tbpr={teamBPlayerRanking}
            />
          </div>
        </div>
        {playerARank && playerBRank && (
          <div className={`w-full flex ${onTop ? 'flex-col-reverse' : 'flex-col'} items-center justify-center `}>
            <h3 className="w-fit leading-4" style={fsToggle(screenWidth)}>
              Pair Score{' '}
            </h3>
            <div className="w-6 border border-black-logo bg-gray-100 text-black">{pairScore}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="net-detail w-full h-full relative flex justify-center items-center flex-col"
      style={{ minHeight: `${boardHeight + EXTRA_HEIGHT}px` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Net top section start  */}
      {/* Assuming renderTeamSection renders content */}
      {renderTeamSection(ETeamPlayer.TA_PA, ETeamPlayer.TA_PB, true, 'top-team')}
      {/* Net top section end  */}

      {/* Vertically centered NetPointCard component */}
      <div className="flex-grow flex justify-center items-center cursor-pointer">
        <NetPointCard net={net} handleLeftShift={handleLeftShift} handleRightShift={handleRightShift} screenWidth={screenWidth} currRoom={currentRoom} roundList={roundList} />
      </div>

      {/* Net bottom section start  */}
      {/* Assuming renderTeamSection renders content */}
      {renderTeamSection(ETeamPlayer.TB_PA, ETeamPlayer.TB_PB, false, 'bottom-team')}
      {/* Net bottom section end */}
    </div>
  );
}

export default NetCard;
