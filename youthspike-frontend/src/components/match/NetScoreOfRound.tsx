/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setNetsByRoundId, setCurrNetNum, setCurrentRoundNets, updateNetPlayer, setUpdateNets } from '@/redux/slices/netSlice';

// Utils
import { screen } from '@/utils/constant';

// Components
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import { INetRelatives, IPlayer, ITeam } from '@/types';
import { useUser } from '@/lib/UserProvider';
import { setCurrentRound } from '@/redux/slices/roundSlice';
import { useSocket } from '@/lib/SocketProvider';
import { setDisabledPlayerIds, setShowTeamPlayers } from '@/redux/slices/matchesSlice';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { ETeamPlayer, INetUpdate } from '@/types/net';
import { ETeam } from '@/types/team';


function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  /**
   * Display specific selected net in mobile screen
   * Display multiple nets with slider
   */

  const socket = useSocket();
  const user = useUser();
  // Redux
  const dispatch = useAppDispatch();

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam, showTeamPlayers, myPlayers, opPlayers, availablePlayerIds, disabledPlayerIds, selectedNet, selectedPlayerSpot, myTeamE, prevPartner, outOfRange } = useAppSelector((state) => state.matches);
  const currentRoom = useAppSelector((state) => state.rooms.current);

  // Local State
  const dialogSettingEl = useRef<HTMLDialogElement | null>(null);

  // Handle events
  const handleSettingOpen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dialogSettingEl.current) return;
    dialogSettingEl.current.showModal();
  };
  const handleSettingClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dialogSettingEl.current) return;
    dialogSettingEl.current.close();
  };

  const handleRoundChange = (e: React.SyntheticEvent, roundId: string) => {
    e.preventDefault();
    // Make a dispatch to change current round, current round num and more related to this
    const findNextRound = roundList.find((r) => r._id === roundId);
    if (findNextRound?.num && currentRound?.num && currentRound?.num < findNextRound?.num) {
      // Must have score for current round for both teams
      if (!currentRound.teamAScore || !currentRound.teamBScore || currentRound.teamAScore === 0 || currentRound.teamBScore === 0) return;
      let validChange = true;

      // Check points in all nets
      let i = 0;
      while (i < currentRoundNets.length) {
        if (!currentRoundNets[i].teamAScore || !currentRoundNets[i].teamBScore) {
          validChange = false;
        }
        i += 1;
      }

      if (!validChange) return;


      const rcd = { room: currentRoom?._id, round: currentRound._id, nextRound: findNextRound._id }; // round change data is rcd
      // @ts-ignore
      if (socket) socket.emit("round-change-from-client", rcd);
    }
    if (findNextRound) {
      dispatch(setCurrentRound(findNextRound));
      const findNets = nets.filter((n) => n.round === findNextRound._id);
      dispatch(setCurrentRoundNets(findNets))
    }
  }

  const isValidNet = (net: INetRelatives,) => net && net._id && net.round;
  const createNetPlayerObject = (net: INetRelatives, teamPlayerId: string, playerSpot: ETeamPlayer, myTeamE: ETeam) => {
    const netPlayerObj = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA || null,
      teamAPlayerB: net.teamAPlayerB || null,
      teamBPlayerA: net.teamBPlayerA || null,
      teamBPlayerB: net.teamBPlayerB || null,
    };

    if (playerSpot === ETeamPlayer.TA_PA || playerSpot === ETeamPlayer.TB_PA) {
      if (myTeamE === ETeam.teamA) {
        netPlayerObj.teamAPlayerA = teamPlayerId
      } else {
        netPlayerObj.teamBPlayerA = teamPlayerId
      }
    } else if (playerSpot === ETeamPlayer.TA_PB || playerSpot === ETeamPlayer.TB_PB) {
      if (myTeamE === ETeam.teamA) {
        netPlayerObj.teamAPlayerB = teamPlayerId
      } else {
        netPlayerObj.teamBPlayerB = teamPlayerId
      }
    }

    return netPlayerObj;
  };
  const handleSelectPlayer = (e: React.SyntheticEvent, teamPlayerId: string) => {
    e.preventDefault();

    const dtp = disabledPlayerIds.includes(teamPlayerId) ? true : false; // dtp = disabled this player
    if (dtp) return;
    dispatch(setShowTeamPlayers(false));
    if (!user || !user.token || !user.info) return;

    if (!selectedNet || !selectedPlayerSpot || !isValidNet(selectedNet)) return;

    const netPlayerObj: INetUpdate = createNetPlayerObject(selectedNet, teamPlayerId, selectedPlayerSpot, myTeamE);

    // Update players of the net
    dispatch(updateNetPlayer(netPlayerObj));
    dispatch(setUpdateNets(netPlayerObj));

    // Duisablee players after selecting them
    // @ts-ignore
    const dpi = [teamPlayerId, ...disabledPlayerIds]; // dpi = disabled players ids
    console.log({ disabledPlayerIds });
    dispatch(setDisabledPlayerIds(dpi));
  };


  useEffect(() => {
    if (currentRoundNets && currentRoundNets.length > 0) {
      dispatch(setCurrNetNum(currentRoundNets[0].num));
    }
  }, []);


  const renderAvailablePlayers = (): React.ReactNode => {
    /**
     * Do not show the player who is already selected
     * Do not show the player who played with the same team mate on previous round
     * Which player to show that can be founded in Available Ids
     */
    const playerListEl: React.ReactNode[] = [];
    let teamPlayerList: IPlayer[] = myPlayers.slice();

    for (let i = 0; i < teamPlayerList.length; i += 1) {
      /*
      // Check prelyer A or player B is selected for the net
      let playerMatch = true;
      if(teamPlayerNum == 3){ // My player A
        // Check previous nets
        if(net?.teamBPlayerA){

        }
      } else if(teamPlayerNum == 4){ // My player B

      }
      */
      const dpIds = [...disabledPlayerIds];
      if (prevPartner) dpIds.push(prevPartner);
      if(outOfRange.length > 0) dpIds.push(...outOfRange); // Net Variance
      const dtp = dpIds.includes(teamPlayerList[i]._id) ? true : false; // dtp = disabled this player

      if (availablePlayerIds.includes(teamPlayerList[i]._id)) {
        playerListEl.push(
          <div key={i} className={`p-1 border-b border-gray-300 flex justify-between items-center w-full gap-1 cursor-pointer ${dtp ? "bg-gray-400" : "bg-transparent"}`} role="presentation" onClick={(e) => handleSelectPlayer(e, teamPlayerList[i]._id)} >
            <p className="w-6 h-6 text-gray-100 rounded-full bg-yellow-500 flex justify-center items-center">{teamPlayerList[i].rank}</p>
            {teamPlayerList[i].profile ? <AdvancedImage cldImg={cld.image(teamPlayerList[i].profile?.toString())} className="w-10 h-10 rounded-full border-2 border-gray-900" /> : <img src='/icons/sports-man.svg' className='svg-black w-10 h-10 rounded-full p-2 border-2 border-gray-900' />}
            <p className=' w-7/12 words-break capitalize'>
              {teamPlayerList[i].firstName} {teamPlayerList[i].lastName}
            </p>
          </div>
        );
      }
    }


    let opNetPlayerA = null, opNetPlayerB = null;
    if (myTeamE === ETeam.teamA) {
      if (selectedNet?.teamBPlayerA) opNetPlayerA = opPlayers.find((p) => p._id === selectedNet.teamBPlayerA);
      if (selectedNet?.teamBPlayerB) opNetPlayerB = opPlayers.find((p) => p._id === selectedNet.teamBPlayerB);
    } else {
      if (selectedNet?.teamAPlayerA) opNetPlayerA = opPlayers.find((p) => p._id === selectedNet.teamAPlayerA);
      if (selectedNet?.teamAPlayerB) opNetPlayerB = opPlayers.find((p) => p._id === selectedNet.teamAPlayerB);
    }

    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <div className='player-list mt-8'>
      {/* {selectedOpTeam.} */}
      {/* {opNetPlayerA && opNetPlayerB && (<div className='w-full border border-gray-300'>
        <h4>Oponent</h4>
        <div className="op-net w-full flex justify-between items-center">
          <div className="op-player-a w-3/6">
            <p className='w-6 h-6 text-gray-100 rounded-full bg-yellow-500 flex justify-center items-center'>{opNetPlayerA.rank}</p>
            <p>{opNetPlayerA.firstName + " " + opNetPlayerA.lastName}</p>
          </div>
          <div className="op-player-b w-3/6">
            <p className='w-6 h-6 text-gray-100 rounded-full bg-yellow-500 flex justify-center items-center'>{opNetPlayerB.rank}</p>
            <p>{opNetPlayerB.firstName + " " + opNetPlayerB.lastName}</p>
          </div>
        </div>
      </div>
      )} */}
      {playerListEl}
    </div>;
  };

  return (
    <div className="net-score container px-4 mx-auto flex justify-between gap-1 text relative mt-4">
      {/* Left side round detail start  */}
      {!showTeamPlayers
        ? (<div className="round-detail w-3/6 border border-gray-300" style={{ height: '30rem' }}>
          <div className="round-top h-3/6 w-full bg-gray-900 text-gray-100 px-2 flex flex-col items-center justify-around">
            <LogoMatchScore dark team={opTeam} />

            <div className="round-nums mt-4 flex w-full justify-start gap-1 items-center">
              {roundList.map((round) => (
                <button className={`single-r w-8 ${round._id === currentRound?._id ? "bg-yellow-500 text-gray-100" : "bg-gray-100 text-gray-900"} py-1 text-center cursor-pointer`} type="button"
                  onClick={(e) => handleRoundChange(e, round._id)} // Currently disabled
                  key={round._id}>
                  RD{round.num}
                </button>
              ))}
            </div>
            <PointsByRound roundList={roundList} dark />
          </div>
          <div className="round-bottom h-3/6 w-full border border-gray-300 px-2 flex flex-col items-center justify-around">
            <PointsByRound roundList={roundList} dark={false} />
            <LogoMatchScore dark={false} team={myTeam} />
          </div>
        </div>)
        : (<div className={`drop-down-select w-3/6 overflow-y-scroll text-gray-900 bg-gray-100 border border-gray-300`}>
          <img src='/icons/close.svg' className='svg-black right-2 top-2' role='presentation' onClick={(e) => dispatch(setShowTeamPlayers(false))} />
          {renderAvailablePlayers()}
        </div>)}

      {/* Left side round detail end  */}

      {/* Setting start  */}
      <dialog ref={dialogSettingEl} className="w-5/6 py-2 h-96" style={{ left: '8.5%', top: '25%', border: 'none' }}>
        <h3>Setting</h3>
        <div className="w-8 h-8" onClick={handleSettingClose} role="presentation">
          <img src="/icons/close.svg" alt="cross" className="w-full" />
        </div>
      </dialog>
      <div className="img-holder p-2 w-8 absolute left-1 bg-gray-100 rounded-full cursor-pointer" style={{ top: '47%' }} role="presentation" onClick={handleSettingOpen} onKeyDown={(e) => { }}>
        <img src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
      {/* Setting end  */}

      {/* Right side net detail start */}
      {screenWidth > screen.xs ? currentRoundNets.map((net) => <NetCard key={net._id} net={net} />) : <NetCard net={currentRoundNets.find((n) => n.num === currNetNum && n.round === currRoundId)} />}
      {/* Right side net detail end */}
    </div>
  );
}

export default NetScoreOfRound;