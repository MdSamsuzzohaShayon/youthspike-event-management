import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ETeam } from '@/types/team';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import React, { useEffect, useMemo } from 'react';
import { ETieBreaker, INetRelatives } from '@/types/net';
import { setNotTieBreakerNetId } from '@/redux/slices/netSlice';
import PointText from './PointText';

interface IBoxProps {
  myTeamE: ETeam;
}

function FinalRoundBox({ myTeamE }: IBoxProps) {
  const dispatch = useAppDispatch();

  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currentRound } = useAppSelector((state) => state.rounds);

  // ===== Derived Data (memoized) =====
  const { pointText, bgClass, isFirstTeam, lockedNetId, lockedNetIds } = useMemo(() => {
    const locked = currentRoundNets.filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);
    const lockedIds = locked.map((n) => n._id);
    const lockedId = lockedIds[0] || null;
    const isFirst = myTeamE === currentRound?.firstPlacing;
    const pointText = `Round ${currentRound?.num} - 2-Point net selection`;
    const bgClass = isFirst ? (lockedId ? 'box-danger' : 'box-success') : lockedId ? 'box-success' : 'box-danger';

    return {
      pointText,
      bgClass,
      isFirstTeam: isFirst,
      lockedNetId: lockedId,
      lockedNetIds: lockedIds,
    };
  }, [myTeamE, currentRound, currentRoundNets]);

  // ===== Select Net Handler =====
  const handleSelectNet = (e: React.SyntheticEvent, netId: string) => {
    e.preventDefault();
    if ((isFirstTeam && lockedNetIds.length === 1) || lockedNetIds.length > 1) return;
    dispatch(setNotTieBreakerNetId(netId));
  };

  // ===== Render Net Button =====
  const netBtnRender = (net?: INetRelatives | undefined) => {
    if (!net) return null;

    const baseProps = {
      type: 'button' as const,
      className: net.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED ? 'btn-light-outline' : 'btn-light',
    };

    const content = net.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED ? `Net ${net.num} banned` : `Net ${net.num}`;

    if (net.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) {
      return (
        <button key={net._id} {...baseProps}>
          {content}
        </button>
      );
    }

    return (
      <button key={net._id} {...baseProps} onClick={(e) => handleSelectNet(e, net._id)}>
        {content}
      </button>
    );
  };

  // ===== JSX =====
  const showNetButtons = isFirstTeam && lockedNetIds.length === 0;
  const buttonsToRender = showNetButtons ? currentRoundNets.map(netBtnRender) : lockedNetId ? currentRoundNets.map(netBtnRender) : [];

  return (
    <div className={`py-2 w-full ${bgClass}`}>
      <div className={`container px-4 mx-auto flex py-2 w-full justify-between items-center gap-1 `}>
        <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
          <PointText txt={pointText} />

          <h2 className="font-black text-start">
            {isFirstTeam
              ? lockedNetIds.length === 0
                ? 'One of the nets in this round will be worth 2 points. Choose a net you do NOT want to be worth 2 points.'
                : 'The other squad is choosing which net they do NOT want to be worth 2 points.'
              : lockedNetIds.length > 0
              ? 'Which of the remaining nets do you NOT want to be worth 2 points?'
              : 'One of the nets this round will be worth 2 points. The other squad is choosing a net they do NOT want to be worth 2 points.'}
          </h2>

          <div className="net-btns w-full flex justify-start items-start gap-x-1">{buttonsToRender}</div>
        </div>

        <div className="hidden md:block w-2/6">
          <Image width={imgW.xs} height={imgW.xs} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>
  );
}

export default FinalRoundBox;