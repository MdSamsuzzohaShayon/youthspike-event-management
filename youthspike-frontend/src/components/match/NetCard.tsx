/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { INet, INetTeam, INetTeamPlayer } from '@/types/net';
import { IPlayerUser } from '@/types/user';
import { setCurrNetNum, updateNetPlayer } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import PlayerScoreCard from './PlayerScoreCard';

interface INetProps {
  net: INet | null | undefined;
}

// Constant
const touchThreshold: number = 50;
const TAPA: number = 1; // Team A Player A
const TAPB: number = 2;
const TBPA: number = 3;
const TBPB: number = 4;

function NetCard({ net }: INetProps) {
  // Hook
  const dispatch = useAppDispatch();

  // Redux State
  const currNetNum = useAppSelector((state) => state.nets.currNetNum);
  const currRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
  const netPlayers = useAppSelector((state) => state.nets.netPlayers);
  const teamAPlayers = useAppSelector((state) => state.players.teamAPlayers);
  const teamBPlayers = useAppSelector((state) => state.players.teamBPlayers);

  // Local State
  const [startPosX, setStartPosX] = useState<number>(0);
  const [teamPlayerNum, setTeamPlayerNum] = useState<number>(0);
  const [drapDown, setDropDown] = useState<boolean>(false);
  const [availablePlayerIds, setAvailablePlayerIds] = useState<string[]>([]);

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
    // e.preventDefault();
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

  const handleKeyUp = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const handleEvacuatePlayer = (tpNum: number) => {
    /**
     * Delete a player from the net
     * team a player 1 = 1, team a player 2 = 2, team b player 1 = 3, team b player 2 = 4
     */
    if (!net || !net._id || !net.roundId || tpNum <= 0 || tpNum > 4) return;
    const prevNetPlayer = netPlayers.find((np) => np.netId === net._id);
    if (!prevNetPlayer) return;
    const netPlayerObj: INetTeam = window.structuredClone(prevNetPlayer);
    if (tpNum === 1) {
      netPlayerObj.teamA.playerAId = null;
    } else if (tpNum === 2) {
      netPlayerObj.teamA.playerBId = null;
    } else if (tpNum === 3) {
      netPlayerObj.teamB.playerAId = null;
    } else if (tpNum === 4) {
      netPlayerObj.teamB.playerBId = null;
    }
    dispatch(updateNetPlayer(netPlayerObj));
  };

  const handleDropdownPlayer = (teamPlayer: number) => {
    setDropDown(true);
    setTeamPlayerNum(teamPlayer);
    /**
     * Show list of available player
     */

    let playerIds: string[] = [];
    if (teamPlayer === 1 || teamPlayer === 2) {
      playerIds = teamAPlayers.map((p) => p._id);
    } else if (teamPlayer === 3 || teamPlayer === 4) {
      playerIds = teamBPlayers.map((p) => p._id);
    }
    setAvailablePlayerIds(playerIds);
  };

  const handleSelectPlayer = (e: React.SyntheticEvent, teamPlayerId: string) => {
    e.preventDefault();
    setDropDown(false);

    if (!net || !net._id || !net.roundId || teamPlayerNum <= 0 || teamPlayerNum > 4) return;
    const prevNetPlayer = netPlayers.find((np) => np.netId === net._id);

    let teamObj: INetTeamPlayer = {
      playerAId: null,
      playerBId: null,
    };

    const netPlayerObj: INetTeam = {
      netId: net._id,
      roundId: net.roundId,
      teamA: { ...teamObj },
      teamB: { ...teamObj },
    };

    // Update previous net if there is any
    if (prevNetPlayer) {
      netPlayerObj.teamA = { ...prevNetPlayer.teamA };
      netPlayerObj.teamB = { ...prevNetPlayer.teamB };
      if (teamPlayerNum === 1 || teamPlayerNum === 2) {
        teamObj = { ...prevNetPlayer.teamA };
      } else if (teamPlayerNum === 3 || teamPlayerNum === 4) {
        teamObj = { ...prevNetPlayer.teamB };
      }
    }

    // Assign players
    if (teamPlayerNum === 1) {
      teamObj.playerAId = teamPlayerId;
      netPlayerObj.teamA = teamObj;
    } else if (teamPlayerNum === 2) {
      teamObj.playerBId = teamPlayerId;
      netPlayerObj.teamA = teamObj;
    } else if (teamPlayerNum === 3) {
      teamObj.playerAId = teamPlayerId;
      netPlayerObj.teamB = teamObj;
    } else if (teamPlayerNum === 4) {
      teamObj.playerBId = teamPlayerId;
      netPlayerObj.teamB = teamObj;
    }
    dispatch(updateNetPlayer(netPlayerObj));
  };

  const matchTPlayer = (tpNum: number): null | IPlayerUser => {
    // tpNum = Team Player Number
    if (tpNum <= 0 || tpNum > 4 || !net || net._id === null) return null;
    const netId = net._id;
    const precizedNetPlayer = netPlayers.find((n) => n.netId === netId);
    if (!precizedNetPlayer) return null;
    let expectedPlayer: IPlayerUser | null | undefined = null;
    if (tpNum === 1) {
      expectedPlayer = teamAPlayers.find((p) => p._id === precizedNetPlayer.teamA.playerAId);
    } else if (tpNum === 2) {
      expectedPlayer = teamAPlayers.find((p) => p._id === precizedNetPlayer.teamA.playerBId);
    } else if (tpNum === 3) {
      expectedPlayer = teamBPlayers.find((p) => p._id === precizedNetPlayer.teamB.playerAId);
    } else if (tpNum === 4) {
      expectedPlayer = teamBPlayers.find((p) => p._id === precizedNetPlayer.teamB.playerBId);
    }
    return expectedPlayer === undefined ? null : expectedPlayer;
  };

  useEffect(() => {
    /**
     * Create a mock net if there is not net found
     * Set player for specific net for set previously
     * Get net player that is selected and pass them to player score card
     */
  }, []);

  const renderPlayers = (): React.ReactNode => {
    /**
     * Do not show the player who is already selected
     * Do not show the player who played with the same team mate on previous round
     * Which player to show that can be founded in Available Ids
     */
    const playerListEl: React.ReactNode[] = [];
    let teamPlayerList: IPlayerUser[] = [];
    if (teamPlayerNum === 1 || teamPlayerNum === 2) {
      teamPlayerList = teamAPlayers.slice();
    } else if (teamPlayerNum === 4 || teamPlayerNum === 3) {
      teamPlayerList = teamBPlayers.slice();
    }

    for (let i = 0; i < teamPlayerList.length; i += 1) {
      if (availablePlayerIds.includes(teamPlayerList[i]._id)) {
        playerListEl.push(
          <p key={i} className="py-2 border-b border-gray-500" role="presentation" onClick={(e) => handleSelectPlayer(e, teamPlayerList[i]._id)}>
            {teamPlayerList[i].firstName} {teamPlayerList[i].lastName}
          </p>,
        );
      }
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{playerListEl}</>;
  };

  return (
    <div className="net-detail w-3/6 relative" style={{ height: '30rem' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`drop-down-select h-full w-full overflow-y-scroll absolute top-0 left-0 text-gray-900 bg-gray-100 z-20 ${drapDown ? '' : 'hidden'}`}>{renderPlayers()}</div>
      {/* Net top section start  */}
      <div className="net-top h-60 w-full bg-gray-900 text-gray-100 px-2 text-center flex flex-col items-center justify-start">
        <p className="h-6 w-6 border-0 rounded-full bg-yellow-500">A</p>
        <div className="player-pair flex justify-between w-full">
          <div className="player-card team-a-player-1 w-16">
            <PlayerScoreCard dark teamPlayer={TAPA} player={matchTPlayer(TAPA)} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
          </div>
          <div className="player-card team-a-player-2 w-16">
            <PlayerScoreCard dark teamPlayer={TAPB} player={matchTPlayer(TAPB)} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
          </div>
        </div>
        <h3>Pair Score 5</h3>
      </div>
      {/* Net top section end  */}

      {/* Net point start  */}
      <div className="absolute z-10 h-28 w-11/12 left-2 bg-yellow-500 flex flex-col justify-around items-center" style={{ top: '39%' }}>
        <div className="score-card-in-net w-3/6 bg-gray-100 text-gray-900 text-center px-4 py-1">
          <p>{net?.teamAScore}</p>
        </div>
        <div className="net-card flex justify-around w-full">
          <img src="/svg_icons/arrow.svg" alt="right-arrow" onKeyUp={handleKeyUp} onClick={handleRightShift} role="presentation" className="w-4" style={{ transform: 'scaleX(-1)' }} />
          <h3>Net {net?.num}</h3>
          <img src="/svg_icons/arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4" />
        </div>
        <div className="score-card-in-net w-3/6 bg-gray-100 text-gray-900 text-center px-4 py-1">
          <p>{net?.teamBScore}</p>
        </div>
      </div>
      {/* Net point end  */}

      {/* Net bottom section start  */}
      <div className="net-bottom h-60 w-full border border-gray-900 px-2 text-center flex flex-col items-center justify-end">
        <h3>Pair Score 5</h3>
        <div className="player-pair flex justify-between w-full">
          <div className="player-card w-16">
            <PlayerScoreCard dark={false} teamPlayer={TBPA} player={matchTPlayer(TBPA)} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
          </div>
          <div className="player-card w-16">
            <PlayerScoreCard dark={false} teamPlayer={TBPB} player={matchTPlayer(TBPB)} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
          </div>
        </div>
        <p className="h-6 w-6 border-0 rounded-full bg-yellow-500">A</p>
      </div>
      {/* Net bottom section end */}
    </div>
  );
}

export default NetCard;
