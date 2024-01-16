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

interface INetProps {
  net?: INetRelatives | null | undefined;
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
  const user = useUser();

  // Redux State
  const currNetNum = useAppSelector((state) => state.nets.currNetNum);
  const currRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
  const teamAPlayers = useAppSelector((state) => state.players.teamAPlayers);
  const teamBPlayers = useAppSelector((state) => state.players.teamBPlayers);
  const playerAssignStrategies = useAppSelector((state) => state.elements.playerAssignStrategy);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const teamA = useAppSelector((state) => state.teams.teamA);
  const teamB = useAppSelector((state) => state.teams.teamB);

  // Local State
  const [startPosX, setStartPosX] = useState<number>(0);
  const [teamPlayerNum, setTeamPlayerNum] = useState<number>(0);
  const [drapDown, setDropDown] = useState<boolean>(false);
  const [availablePlayerIds, setAvailablePlayerIds] = useState<string[]>([]);
  const [openPasControl, setOpenPasControl] = useState<boolean>(false); // pas = Player Assign Strategy
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


  const handleEvacuatePlayer = (tpNum: number) => {
    if (!user.token || !user.info) return;
    /**
     * Delete a player from the net
     * team a player 1 = 1, team a player 2 = 2, team b player 1 = 3, team b player 2 = 4
     */
    if (!net || !net._id || !net.round || tpNum <= 0 || tpNum > 4) return;

    let netPlayerObj: INetUpdate = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA ? net.teamAPlayerA : null,
      teamAPlayerB: net.teamAPlayerB ? net.teamAPlayerB : null,
      teamBPlayerA: net.teamBPlayerA ? net.teamBPlayerA : null,
      teamBPlayerB: net.teamBPlayerB ? net.teamBPlayerB : null,
    };

    if (tpNum === 1) {
      netPlayerObj.teamAPlayerA = null;
    } else if (tpNum === 2) {
      netPlayerObj.teamAPlayerB = null;
    } else if (tpNum === 3) {
      netPlayerObj.teamBPlayerA = null;
    } else if (tpNum === 4) {
      netPlayerObj.teamBPlayerB = null;
    }
    dispatch(updateNetPlayer(netPlayerObj));
    dispatch(setUpdateNets(netPlayerObj));
  };

  const handleDropdownPlayer = (e: React.SyntheticEvent, teamPlayer: number) => {
    e.preventDefault();
    if (!user.token || !user.info || teamPlayer === 1 || teamPlayer === 2) return;

    const isTeamAProcessValid = myTeamE === ETeam.teamA && currentRoom?.teamAProcess === EActionProcess.CHECKIN && (currentRoom?.teamBProcess === EActionProcess.CHECKIN || currentRoom?.teamBProcess === EActionProcess.LINEUP);
    const isTeamBProcessValid = myTeamE === ETeam.teamB && currentRoom?.teamBProcess === EActionProcess.CHECKIN && (currentRoom?.teamAProcess === EActionProcess.CHECKIN || currentRoom?.teamAProcess === EActionProcess.LINEUP);

    if (!(isTeamAProcessValid || isTeamBProcessValid)) {
      return;
    }

    // At first team A will submit their players 
    if(myTeamE === ETeam.teamA && currentRoom.teamAProcess === EActionProcess.LINEUP) return;
    if(myTeamE === ETeam.teamB && currentRoom.teamAProcess !== EActionProcess.LINEUP) return;

    setDropDown(true);
    setTeamPlayerNum(teamPlayer);
    /**
     * Show list of available player
     * Remove players from subs of the rounds
     * Remove players who is already selected on another net
     * Remove players who had been palyed with same player in the previous round
     */

    let playerIds: string[] = [];
    if (teamPlayer === 1 || teamPlayer === 2) {
      playerIds = opPlayers.map((p) => p._id);
    } else if (teamPlayer === 3 || teamPlayer === 4) {
      playerIds = myPlayers.map((p) => p._id);
    }
    for (const currNet of currRoundNets) {
      if (currNet.teamAPlayerA && playerIds.includes(currNet.teamAPlayerA)) {
        playerIds = playerIds.filter((pi) => pi !== currNet.teamAPlayerA);
      }
      if (currNet.teamAPlayerB && playerIds.includes(currNet.teamAPlayerB)) {
        playerIds = playerIds.filter((pi) => pi !== currNet.teamAPlayerB);
      }
      if (currNet.teamBPlayerA && playerIds.includes(currNet.teamBPlayerA)) {
        playerIds = playerIds.filter((pi) => pi !== currNet.teamBPlayerA);
      }
      if (currNet.teamBPlayerB && playerIds.includes(currNet.teamBPlayerB)) {
        playerIds = playerIds.filter((pi) => pi !== currNet.teamBPlayerB);
      }
    }
    setAvailablePlayerIds(playerIds);
  };

  const isValidNet = (net: INetRelatives, teamPlayerNum: number) => net && net._id && net.round && teamPlayerNum > 0 && teamPlayerNum <= 4;
  const createNetPlayerObject = (net: INetRelatives, teamPlayerId: string, teamPlayerNum: number, myTeamE: ETeam) => {
    const netPlayerObj = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA || null,
      teamAPlayerB: net.teamAPlayerB || null,
      teamBPlayerA: net.teamBPlayerA || null,
      teamBPlayerB: net.teamBPlayerB || null,
    };

    const isTeamA = myTeamE === ETeam.teamA;
    const teamKey = isTeamA ? 'teamA' : 'teamB';
    const playerPosition = teamPlayerNum % 2 === 0 ? 'PlayerB' : 'PlayerA';

    netPlayerObj[`${teamKey}${playerPosition}`] = teamPlayerId;

    return netPlayerObj;
  };
  const handleSelectPlayer = (e: React.SyntheticEvent, teamPlayerId: string) => {
    e.preventDefault();
    setDropDown(false);
    if (!user || !user.token || !user.info) return;

    if (!net || !isValidNet(net, teamPlayerNum)) return;

    const netPlayerObj: INetUpdate = createNetPlayerObject(net, teamPlayerId, teamPlayerNum, myTeamE);

    // Update players of the net
    dispatch(updateNetPlayer(netPlayerObj));
    dispatch(setUpdateNets(netPlayerObj));
  };

  const handlePASSelect = (e: React.SyntheticEvent, pas: string) => { // PAS = Player Assign Strategies
    e.preventDefault();
    setOpenPasControl((prevState) => !prevState);
  }


  useEffect(() => {
    /**
     * Check my players, scores and others players score
     * If both teams locked then captain can input score
    */
    if (currentRoom && currentRoom.teamAProcess === EActionProcess.LOCKED && currentRoom.teamBProcess === EActionProcess.LOCKED) {

    }
  }, [currentRoom, user]);

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

  /**
   * Renders logically
   */
  const matchTPlayer = (tpNum: number): null | IPlayer => {
    // tpNum = Team Player Number
    if (tpNum <= 0 || tpNum > 4 || !net || !net.round || !net._id) return null;
    let expectedPlayer: IPlayer | null | undefined = null;


    let myPlayerA = net.teamBPlayerA, myPlayerB = net.teamBPlayerB;
    let opPlayerA = net.teamAPlayerA, opPlayerB = net.teamAPlayerB;
    if (myTeamE === ETeam.teamA) {
      myPlayerA = net.teamAPlayerA; myPlayerB = net.teamAPlayerB;
      opPlayerA = net.teamBPlayerA; opPlayerB = net.teamBPlayerB;
    }

    if (tpNum === 1) {
      expectedPlayer = opPlayers.find((p) => p._id === opPlayerA);
    } else if (tpNum === 2) {
      expectedPlayer = opPlayers.find((p) => p._id === opPlayerB);
    } else if (tpNum === 3) {
      expectedPlayer = myPlayers.find((p) => p._id === myPlayerA);
    } else if (tpNum === 4) {
      expectedPlayer = myPlayers.find((p) => p._id === myPlayerB);
    }
    return expectedPlayer === undefined ? null : expectedPlayer;
  };

  const renderAvailablePlayers = (): React.ReactNode => {
    /**
     * Do not show the player who is already selected
     * Do not show the player who played with the same team mate on previous round
     * Which player to show that can be founded in Available Ids
     */
    const playerListEl: React.ReactNode[] = [];
    let teamPlayerList: IPlayer[] = [];
    if (teamPlayerNum === 1 || teamPlayerNum === 2) {
      teamPlayerList = opPlayers.slice(); // Shallow copy
    } else if (teamPlayerNum === 4 || teamPlayerNum === 3) {
      teamPlayerList = myPlayers.slice(); // Shallow copy
    }

    for (let i = 0; i < teamPlayerList.length; i += 1) {
      if (availablePlayerIds.includes(teamPlayerList[i]._id)) {
        playerListEl.push(
          <div key={i} className="p-2 border-b border-gray-500 flex justify-between items-center w-full gap-1" role="presentation" onClick={(e) => handleSelectPlayer(e, teamPlayerList[i]._id)} >
            {teamPlayerList[i].profile ? <AdvancedImage cldImg={cld.image(teamPlayerList[i].profile?.toString())} className="w-10 h-10 rounded-full border-2 border-gray-900" /> : <img src='/icons/sports-man.svg' className='svg-black w-10 h-10 rounded-full p-2 border-2 border-gray-900' />}
            <p className='words-break capitalize'>
              {teamPlayerList[i].firstName} {teamPlayerList[i].lastName}
            </p>
          </div>
        );
      }
    }
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{playerListEl}</>;
  };

  return (
    <div className="net-detail w-3/6 relative" style={{ height: '30rem' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`drop-down-select h-full w-full overflow-y-scroll absolute top-0 left-0 text-gray-900 bg-gray-100 z-20 ${drapDown ? '' : 'hidden'}`}>
        <img src='/icons/close.svg' className='absolute w-8 h-8 svg-black right-2 top-2' role='presentation' onClick={(e) => setDropDown(false)} />
        {renderAvailablePlayers()}
      </div>
      {/* Net top section start  */}
      <div className="net-top h-60 w-full bg-gray-900 text-gray-100 px-2 text-center flex flex-col items-center justify-start">
        {/* <p className="h-6 w-6 border-0 rounded-full bg-yellow-500">A</p> */}
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

      <NetPointCard teamA={teamA} teamB={teamB} net={net} handleLeftShift={handleLeftShift} handleRightShift={handleRightShift} />

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
        <div className="h-6 w-6 border-0 rounded-full bg-yellow-500 text-gray-100 relative">
          <button type='button' onClick={e => setOpenPasControl((prevState) => !prevState)} >A</button>
          {openPasControl && (
            <ul className="player-select-strategy bg-gray-800 w-24 absolute bottom-6 inset-x-0" style={{ left: '50%', transform: 'translate(-50%)' }} >
              {playerAssignStrategies.map((pas) => (
                <li className='p-2 border-b border-yellow-500 capitalize' key={pas} role="presentation" onClick={e => handlePASSelect(e, pas)} >{pas}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Net bottom section end */}
    </div>
  );
}

export default NetCard;