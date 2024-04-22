/* eslint-disable react/require-default-props */
import { UPDATE_ROUND } from '@/graphql/round';
import { useAppDispatch } from '@/redux/hooks';
import { IPlayer, IRoundRelatives } from '@/types';
import updateSubbedPlayer from '@/utils/requestHandlers/updateSubbedPlayer';
import { useMutation } from '@apollo/client';
import Image from 'next/image';
import React, { useState } from 'react';

interface ISubbedPlayerCardProps {
  player: IPlayer;
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  subControl?: boolean;
}

function SubbedPlayerCard({ player, currRound, roundList, subControl }: ISubbedPlayerCardProps) {
  const dispatch = useAppDispatch();

  const [showAction, setShowAction] = useState<boolean>(false);

  // ===== GraphQL =====
  const [mutateRound] = useMutation(UPDATE_ROUND);

  const handleRemovePlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await updateSubbedPlayer({ playerId: player._id, currRound, dispatch, mutateRound, roundList });
  };
  return (
    <div className="small-player-card border-light p-1 flex items-center gap-x-1 relative">
      <h4 className="capitalize">{`${player.rank}. ${player.firstName} ${player.lastName}`}</h4>
      {subControl && (
        <Image alt="Option icon" className="svg-white cursor-pointer" src="/icons/dots-vertical.svg" width={16} height={16} role="presentation" onClick={() => setShowAction(!showAction)} />
      )}

      {showAction && subControl && (
        <ul className="absolute actionBox bg-gray-900 text-gray-100 p-2 right-3">
          <li role="presentation" onClick={handleRemovePlayer} className="cursor-pointer">
            Remove
          </li>
        </ul>
      )}
    </div>
  );
}

export default SubbedPlayerCard;
