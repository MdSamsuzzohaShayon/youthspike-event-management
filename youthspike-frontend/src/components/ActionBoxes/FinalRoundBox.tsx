import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { changeTheRound, lineupToUpdatePoints, updateMultiplePoints } from '@/utils/match/emitSocketEvents';
import React, { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client';
import PointText from './PointText';
import { ETeamPlayer, ETieBreaker, INetRelatives } from '@/types/net';
import { setNotTieBreakerNetId } from '@/redux/slices/netSlice';

interface IBoxProps {
  currRoom: IRoom | null;
  socket: Socket | null;
  otp: EActionProcess;
  myTeamE: ETeam;
}

function FinalRoundBox({ currRoom, socket, otp, myTeamE }: IBoxProps) {

  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Local State =====
  const [pTxt, setPTxt] = useState<string>('');
  const [bgBox, setBgBox] = useState<string>("box-danger");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { current: currentRound, roundList, } = useAppSelector((state) => state.rounds);

  const handleSelectNet = (e: React.SyntheticEvent, netId: string) => {
    e.preventDefault();
    dispatch(setNotTieBreakerNetId(netId));
  }

  useEffect(() => {
    let pt = '';
    let bb = "box-danger";
    if (myTeamE === currentRound?.firstPlacing) {
      pt = `Round ${currentRound?.num} - 2-Point net selection`;
      bb = "box-success";
    } else {
      pt = `Round ${currentRound?.num} - 2-Point net selection`;
      setIsWaiting(true);
      bb = "box-danger";
    }
    setPTxt(pt);
    setBgBox(bb);
  }, [otp, currentRound]);

  const netBtnRender = (net: INetRelatives) => {
    switch (net.netType) {
      case ETieBreaker.FINAL_ROUND_NET:
        return <button key={net._id} className="btn-light" type='button' onClick={(e) => handleSelectNet(e, net._id)}>Net {net.num}</button>;
      case ETieBreaker.FINAL_ROUND_NET_LOCKED:
        return <button key={net._id} className="btn-light-outline" type='button' onClick={(e) => handleSelectNet(e, net._id)}>Net {net.num} banned</button>;

      case ETieBreaker.TIE_BREAKER_NET:
        return <button key={net._id} className="btn-light" type='button' onClick={(e) => handleSelectNet(e, net._id)}>Net {net.num}</button>;

      default:
        return <button key={net._id} className="btn-light" type='button' onClick={(e) => handleSelectNet(e, net._id)}>Net {net.num}</button>;
    }
  }

  console.log(currRoundNets);
  

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${bgBox}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {myTeamE === currentRound?.firstPlacing
          ? (<React.Fragment>
            <h2 className="font-black text-start">One of the nets this round will be worth 2 points. Choose a net you do NOT want to be worth 2 points.</h2>
            <div className="net-btns w-full flex justify-start items-start gap-x-1">
              {currRoundNets.map((n) => netBtnRender(n))}
            </div>
          </React.Fragment>)
          : <React.Fragment>
            <h2 className="font-black text-start">One of the nets this round will be worth 2 points. The other squad is choosing a net they do NOT want to be worth 2 points.</h2>
          </React.Fragment>}
      </div>
      <div className="hidden md:block w-2/6">
        <img src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  )
}

export default FinalRoundBox;