import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ETeam } from '@/types/team';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import React, { useEffect, useState } from 'react';
import { ETieBreaker, INetRelatives } from '@/types/net';
import { setNotTieBreakerNetId } from '@/redux/slices/netSlice';
import PointText from './PointText';

interface IBoxProps {
  myTeamE: ETeam;
}

function FinalRoundBox({ myTeamE }: IBoxProps) {
  // ===== Hooks =====
  const dispatch = useAppDispatch();

  // ===== Local State =====
  const [pTxt, setPTxt] = useState<string>('');
  const [bgBox, setBgBox] = useState<string>('box-danger');
  const [lockedNetId, setLockedNetId] = useState<string | null>(null);
  const [lockedNetIds, setLockedNetIds] = useState<string[]>([]);

  const { currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { current: currentRound } = useAppSelector((state) => state.rounds);

  const handleSelectNet = (e: React.SyntheticEvent, netId: string) => {
    e.preventDefault();
    if (myTeamE === currentRound?.firstPlacing && lockedNetIds.length === 1) {
      return;
    }
    if (lockedNetIds.length > 1) return;
    dispatch(setNotTieBreakerNetId(netId));
  };

  useEffect(() => {
    let pt = '';
    let bb = 'box-danger';
    let lni = null;
    const lockedIds: string[] = [];

    currRoundNets.forEach((n) => {
      if (n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) {
        lni = n._id;
        lockedIds.push(n._id);
      }
    });

    if (myTeamE === currentRound?.firstPlacing) {
      pt = `Round ${currentRound?.num} - 2-Point net selection`;
      bb = lni ? 'box-danger' : 'box-success';
    } else {
      pt = `Round ${currentRound?.num} - 2-Point net selection`;
      bb = lni ? 'box-success' : 'box-danger';
    }
    setLockedNetId(lni);
    setPTxt(pt);
    setBgBox(bb);
    setLockedNetIds(lockedIds);
  }, [currentRound, myTeamE, currRoundNets]);


  const netBtnRender = (net: INetRelatives | undefined) => {
    if (!net) return null;
    switch (net.netType) {
      case ETieBreaker.FINAL_ROUND_NET:
        return (
          <button key={net._id} className="btn-light" type="button" onClick={(e) => handleSelectNet(e, net._id)}>
            Net {net.num}
          </button>
        );
      case ETieBreaker.FINAL_ROUND_NET_LOCKED:
        return (
          <button key={net._id} className="btn-light-outline" type="button">
            Net {net.num} banned
          </button>
        );

      case ETieBreaker.TIE_BREAKER_NET:
        return (
          <button key={net._id} className="btn-light" type="button" onClick={(e) => handleSelectNet(e, net._id)}>
            Net {net.num}
          </button>
        );

      default:
        return (
          <button key={net._id} className="btn-light" type="button" onClick={(e) => handleSelectNet(e, net._id)}>
            Net {net.num}
          </button>
        );
    }
  };

  return (
    <div className={`flex py-2 w-full justify-between items-center gap-1 ${bgBox}`}>
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt={pTxt} />
        {myTeamE === currentRound?.firstPlacing ? (
          <>
            <h2 className="font-black text-start">
              {lockedNetIds.length === 0
                ? 'One of the net of this round will be worth 2 points. Choose a net you do NOT want to be worth 2 points.'
                : 'The other squad is choosing which net they do NOT want to be worth 2 points.'}
            </h2>

            <div className="net-btns w-full flex justify-start items-start gap-x-1">
              {lockedNetIds.length === 0 ? currRoundNets.map((n) => netBtnRender(n)) : netBtnRender(currRoundNets.find((n) => n._id === lockedNetId))}
              {/* {!lockedNetId ? currRoundNets.map((n) => netBtnRender(n)) : netBtnRender(currRoundNets.find((n) => n._id === lockedNetId))} */}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-black text-start">
              {lockedNetIds.length > 0
                ? 'Which of the remaining nets  do you NOT want to be worth 2 points?'
                : 'One of the nets this round will be worth 2 points. The other squad is choosing a net they do NOT want to be worth 2 points.'}
            </h2>
            <div className="net-btns w-full flex justify-start items-start gap-x-1">{lockedNetId && currRoundNets.map((n) => netBtnRender(n))}</div>
          </>
        )}
      </div>
      <div className="hidden md:block w-2/6">
        <Image width={imgW.xs} height={imgW.xs} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

export default FinalRoundBox;
