/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum, setCurrentRoundNets, updateNetPlayer, setNets } from '@/redux/slices/netSlice';

// Utils
import { netSize, screen } from '@/utils/constant';

// Components
import LogoMatchScore from './LogoMatchScore';
import PointsByRound from './PointsByRound';
import NetCard from './NetCard';
import { IError, INetRelatives, IPlayer, ITeam } from '@/types';
import { useUser } from '@/lib/UserProvider';
import { useSocket } from '@/lib/SocketProvider';
import { setDisabledPlayerIds, setOutOfRange, setShowTeamPlayers } from '@/redux/slices/matchesSlice';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { ETeamPlayer, INetUpdate } from '@/types/net';
import { ETeam } from '@/types/team';
import { canGoNextOrPrevRound, changeTheRound } from '@/utils/match/emitSocketEvents';
import MatchSetting from './MatchSetting';
import { setNetH } from '@/utils/helper';
import { border } from '@/utils/styles';
import { EPlayerStatus } from '@/types/player';


function NetScoreOfRound({ currRoundId }: { currRoundId: string }) {
  /**
   * Display specific selected net in mobile screen
   * Display multiple nets with slider
   */

  const user = useUser();
  const dispatch = useAppDispatch();
  const socket = useSocket();


  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { currNetNum, currentRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam, showTeamPlayers, myPlayers, opPlayers, availablePlayerIds, disabledPlayerIds, selectedNet, selectedPlayerSpot, myTeamE, opTeamE, prevPartner, outOfRange, match }
    = useAppSelector((state) => state.matches);
  const currRoom = useAppSelector((state) => state.rooms.current);






  // Input Change

  const handleRoundChange = (e: React.SyntheticEvent, roundId: string) => {
    e.preventDefault();
    let next = false;
    let targetRoundIndex = roundList.findIndex((r) => r._id === roundId);
    if (targetRoundIndex !== -1 && currentRound) {
      if (roundList[targetRoundIndex].num > currentRound?.num) {
        next = true;
        targetRoundIndex = canGoNextOrPrevRound({ currRound: currentRound, roundList, next, currRoundNets: currentRoundNets, dispatch });
      }
      if (targetRoundIndex !== -1) changeTheRound({ socket, roundList, dispatch, allNets, currRoom, newRoundIndex: targetRoundIndex, myTeamE, currRound: currentRound });
    }
    // Change current round and current round list
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

    // Vslidate selecting invalid players 
    const dpIds = [...disabledPlayerIds];
    if (prevPartner) dpIds.push(prevPartner);
    if (outOfRange.length > 0) dpIds.push(...outOfRange); // Net Variance
    const dtp = dpIds.includes(teamPlayerId) ? true : false; // dtp = disabled this player
    if (dtp) return;


    dispatch(setShowTeamPlayers(false));
    if (!user || !user.token || !user.info) return;

    if (!selectedNet || !selectedPlayerSpot || !isValidNet(selectedNet)) return;

    const netPlayerObj: INetUpdate = createNetPlayerObject(selectedNet, teamPlayerId, selectedPlayerSpot, myTeamE);

    // Update all nets and current round nets
    const updatedCRN = [...currentRoundNets]; // crn = current round nets
    const updatedAllNets = [...allNets];
    const findCRN = updatedCRN.findIndex((n) => n._id === selectedNet._id);
    if (findCRN !== -1) updatedCRN[findCRN] = { ...updatedCRN[findCRN], ...netPlayerObj };
    const findAN = updatedAllNets.findIndex((n) => n._id === selectedNet._id);
    if (findAN !== -1) updatedAllNets[findAN] = { ...updatedAllNets[findAN], ...netPlayerObj };
    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));




    // Disabled players after selecting them
    // @ts-ignore
    const dpi = [teamPlayerId, ...disabledPlayerIds]; // dpi = disabled players ids
    dispatch(setDisabledPlayerIds(dpi));
    dispatch(setOutOfRange([]));
  };

  const handleClosePlayers = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  }




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
      const dpIds = [...disabledPlayerIds];
      if (prevPartner) dpIds.push(prevPartner);
      if (outOfRange.length > 0) dpIds.push(...outOfRange); // Net Variance
      const dtp = dpIds.includes(teamPlayerList[i]._id) ? true : false; // dtp = disabled this player

      // Inactive players should not be shown
      if (availablePlayerIds.includes(teamPlayerList[i]._id) && teamPlayerList[i].status !== EPlayerStatus.INACTIVE) {
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
      {playerListEl}
    </div>;
  };

  // console.log({ teamA: user.info?.captainplayer === teamA?.captain?._id, tas: net?.teamAScore });


  return (
    <div className="net-score container px-4 mx-auto flex justify-between gap-1 text relative mt-4">
      {/* Left side round detail start  */}
      {!showTeamPlayers
        ? (<div className={`round-detail border ${border.light} ${screenWidth > screen.xs ? "w-3/12" : "w-3/6"}`} style={setNetH(screenWidth)}>
          {/* Top Side Start  */}
          <div className="round-top w-full h-3/6 bg-gray-900 text-gray-100 px-2 flex flex-col items-center justify-around">
            <LogoMatchScore dark team={opTeam} roundList={roundList} teamE={opTeamE} screenWidth={screenWidth} allNets={allNets} />

            <div className={`round-nums ${screenWidth > screen.xs ? "mt-2" : "mt-4"} flex w-full justify-start gap-1 items-center`}>
              {roundList.map((round) => (
                <button className={`single-r ${round._id === currentRound?._id ? "bg-yellow-500 text-gray-100" : "bg-gray-100 text-gray-900"} py-1 text-center cursor-pointer ${screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"}`} type="button"
                  onClick={(e) => handleRoundChange(e, round._id)}
                  key={round._id}>
                  RD{round.num}
                </button>
              ))}
            </div>
            <PointsByRound roundList={roundList} dark screenWidth={screenWidth} />
          </div>
          {/* Top Side End  */}

          {/* Bottom Side Start  */}
          <div className={`round-bottom w-full h-3/6 border ${border.light} px-2 flex flex-col items-center justify-around`}>
            <PointsByRound roundList={roundList} dark={false} screenWidth={screenWidth} />
            <LogoMatchScore dark={false} team={myTeam} roundList={roundList} teamE={myTeamE} screenWidth={screenWidth} allNets={allNets} />
          </div>
          {/* Bottom Side End  */}
        </div>)
        : (<div className={`drop-down-select w-3/6 overflow-y-scroll text-gray-900 bg-gray-100 border ${border.light}`} style={setNetH(screenWidth)}>
          <img src='/icons/close.svg' className='svg-black right-2 top-2' role='presentation' onClick={handleClosePlayers} />
          <div className="px-2 w-full">
            <h3>Selected Net {selectedNet?.num}</h3>
          </div>
          {renderAvailablePlayers()}
        </div>)}
      {/* Left side round detail end  */}

      {/* Setting start  */}
      <MatchSetting match={match} myTeam={myTeam} opTeam={opTeam} />
      {/* Setting end  */}

      {/* Right side net detail start */}
      <div className={`right-side net-card-wrapper border ${border.light} flex ${screenWidth > screen.xs ? "w-9/12" : "w-3/6"}`} style={setNetH(screenWidth)}>
        {screenWidth > screen.xs
          ? currentRoundNets.map((net) => <NetCard key={net._id} net={net} screenWidth={screenWidth} />)
          : <NetCard net={currentRoundNets.find((n) => n.num === currNetNum && n.round === currRoundId)} screenWidth={screenWidth} />}
      </div>
      {/* Right side net detail end */}

    </div>
  );
}

export default NetScoreOfRound;