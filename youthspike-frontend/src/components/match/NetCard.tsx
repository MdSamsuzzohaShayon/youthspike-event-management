/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';

// Redux
import { setCurrNetNum, updateNetPlayer } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUpdateNets } from '@/redux/slices/netSlice';

// Components
import PlayerScoreCard from './PlayerScoreCard';

// Utils / libs / config
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';

// Types
import { IUser, IUserContext, UserRole } from '@/types/user';
import { IPlayer, INetRelatives, INetUpdate, ITeam } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import NetPointCard from './NetPointCard';
import { calcPairScore } from '@/utils/helper';
import { setAvailablePlayers, setDisabledPlayerIds, setSelectedNet, setPlayerSpot, setShowTeamPlayers, setPrevPartner, setOutOfRange } from '@/redux/slices/matchesSlice';
import { ETeamPlayer } from '@/types/net';
import findOutOfRange from '@/utils/match/findOutOfRange';
import findPrevPartner from '@/utils/match/findPrevPartner';

interface INetCardProps {
  net?: INetRelatives | null | undefined;
}

// Constant
const touchThreshold: number = 50;

function NetCard({ net }: INetCardProps) {
  // Hook
  const dispatch = useAppDispatch();
  const user = useUser();

  // Redux State
  const { currNetNum, currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const playerAssignStrategies = useAppSelector((state) => state.elements.playerAssignStrategy);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { disabledPlayerIds, match: currMatch } = useAppSelector((state) => state.matches);

  // Local State
  const [startPosX, setStartPosX] = useState<number>(0);
  const [openPasControl, setOpenPasControl] = useState<boolean>(false); // pas = Player Assign Strategy
  const [myPlayers, setMyPlayers] = useState<IPlayer[]>([]);
  const [opPlayers, setOpPlayers] = useState<IPlayer[]>([]); // Op = oponent
  const [myTeamE, setMyTeamE] = useState<ETeam>(ETeam.teamB);

  // const [prevRoundNets, setPrevRoundNets] = useState<INetRelatives[]>([]);

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

    let netPlayerObj: INetUpdate = {
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

    dispatch(updateNetPlayer(netPlayerObj));
    dispatch(setUpdateNets(netPlayerObj));
    dispatch(setDisabledPlayerIds([...disabledPlayerIds.filter((dp) => dp === evacuatedPlayerId)]))
  };

  const handleDropdownPlayer = (e: React.SyntheticEvent, playerSpot: ETeamPlayer) => {
    e.preventDefault();
    if (!user.token || !user.info) return;
    

    let isTeamProcessValid = false;
    if (myTeamE === ETeam.teamA) {
      if (currentRoom?.teamAProcess === EActionProcess.CHECKIN
        && (currentRoom?.teamBProcess === EActionProcess.CHECKIN || currentRoom?.teamBProcess === EActionProcess.LINEUP)) {
        isTeamProcessValid = true;
      }
    } else {
      if (currentRoom?.teamBProcess === EActionProcess.CHECKIN
        && (currentRoom?.teamAProcess === EActionProcess.CHECKIN || currentRoom?.teamAProcess === EActionProcess.LINEUP)) {
        isTeamProcessValid = true;
      }
    }
    if (!isTeamProcessValid) return;

    // At first team A will submit their players 
    if (myTeamE === ETeam.teamA && currentRoom && currentRoom.teamAProcess === EActionProcess.LINEUP) return;
    if (myTeamE === ETeam.teamB && currentRoom && currentRoom.teamAProcess !== EActionProcess.LINEUP) return;

    dispatch(setShowTeamPlayers(true))
    dispatch(setPlayerSpot(playerSpot));
    if (net) dispatch(setSelectedNet(net))
    /**
     * Show list of available player
     * Remove players from subs of the rounds
     * Remove players who is already selected on another net
     * Remove players who had been palyed with same player in the previous round
     */



    // Disabled players who played with him in previous round
    const prevPartnerId = findPrevPartner({ roundList, currRound, allNets, myTeamE, net });
    prevPartnerId ? dispatch(setPrevPartner(prevPartnerId)) : dispatch(setPrevPartner(null));

    // Disable players according to met variance
    const inavalidPlayerIds = findOutOfRange({ currMatch, net, myPlayers, myTeamE, opPlayers, playerSpot });
    if (inavalidPlayerIds.length > 0) dispatch(setOutOfRange(inavalidPlayerIds));


  };



  const handlePASSelect = (e: React.SyntheticEvent, pas: string) => { // PAS = Player Assign Strategies
    e.preventDefault();
    setOpenPasControl((prevState) => !prevState);
  }


  useEffect(() => {
    if (!teamAPlayers || !teamBPlayers || !user) return;
    if (user.info && user.info.captainplayer === teamA?.captain?._id) {
      setMyPlayers([...teamAPlayers]);
      setOpPlayers([...teamBPlayers]);
      setMyTeamE(ETeam.teamA);
    } else {
      setMyPlayers([...teamBPlayers]);
      setOpPlayers([...teamAPlayers]);
    }
  }, [teamAPlayers, teamBPlayers, user]);

  useEffect(() => {
    // Setting previous round nets
    if (currRound) {
      const cri = roundList.findIndex((r) => r._id === currRound._id); // cri = current round index
      if (cri > 0) {
        const pr = roundList[cri - 1]; // pr previous round
        if (pr) {
          const findPRN = allNets.filter((n) => n.round === pr._id); // prn == previous round nets
          if (findPRN && findPRN.length > 0) {
            // setPrevRoundNets(prevRoundNets);
          }
        }
      }
    }
  }, [currRoundNets, currRound, roundList]);

  /**
   * Renders logically
   */
  const matchTPlayer = (teamPlayer: ETeamPlayer): null | IPlayer => {
    // tpNum = Team Player Number
    if (!net || !net.round || !net._id) return null;
    let expectedPlayer: IPlayer | null | undefined = null;


    let myPlayerA = net.teamBPlayerA, myPlayerB = net.teamBPlayerB;
    let opPlayerA = net.teamAPlayerA, opPlayerB = net.teamAPlayerB;
    if (myTeamE === ETeam.teamA) {
      myPlayerA = net.teamAPlayerA; myPlayerB = net.teamAPlayerB;
      opPlayerA = net.teamBPlayerA; opPlayerB = net.teamBPlayerB;
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

  const renderTeamSection = (TPA: ETeamPlayer, TPB: ETeamPlayer, onTop: boolean): React.ReactNode => {

    const playerA = matchTPlayer(TPA);
    const playerB = matchTPlayer(TPB);
    const playerARank = playerA?.rank, playerBRank = playerB?.rank;
    const pairScore = calcPairScore(playerARank, playerBRank);
    return (<div className={`net-top h-60 w-full px-2 text-center flex ${onTop ? 'flex-col bg-gray-900 text-gray-100 ' : 'flex-col-reverse bg-gray-100 text-gray-900'} border border-gray-300 items-center justify-start`}>
      {!onTop && (<div className="h-6 w-6 border-0 rounded-full bg-yellow-500 text-gray-100 relative">
        <button type='button' onClick={e => setOpenPasControl((prevState) => !prevState)} >A</button>
        {openPasControl && (
          <ul className="player-select-strategy bg-gray-800 w-24 absolute bottom-6 inset-x-0" style={{ left: '50%', transform: 'translate(-50%)' }} >
            {playerAssignStrategies.map((pas) => (
              <li className='p-2 border-b border-yellow-500 capitalize' key={pas} role="presentation" onClick={e => handlePASSelect(e, pas)} >{pas}</li>
            ))}
          </ul>
        )}
      </div>)}
      <div className="player-pair flex justify-between w-full">
        <div className={`player-card team-a-player-1 w-16 ${!onTop && "border border-gray-300"}`}>
          <PlayerScoreCard dark={onTop} teamPlayer={TPA} player={playerA} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
        </div>
        <div className={`player-card team-a-player-2 w-16 ${!onTop && "border border-gray-300"}`}>
          <PlayerScoreCard dark={onTop} teamPlayer={TPB} player={playerB} dropdownPlayer={handleDropdownPlayer} evacuatePlayer={handleEvacuatePlayer} />
        </div>
      </div>
      <h3>Pair Score {pairScore}</h3>
    </div>);
  }

  return (
    <div className="net-detail w-3/6 relative" style={{ height: '30rem' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Net top section start  */}
      {renderTeamSection(ETeamPlayer.TA_PA, ETeamPlayer.TA_PB, true)}
      {/* Net top section end  */}

      <NetPointCard teamA={teamA} teamB={teamB} net={net} handleLeftShift={handleLeftShift} handleRightShift={handleRightShift} />

      {/* Net bottom section start  */}
      {renderTeamSection(ETeamPlayer.TB_PA, ETeamPlayer.TB_PB, false)}
      {/* Net bottom section end */}
    </div>
  );
}

export default NetCard;