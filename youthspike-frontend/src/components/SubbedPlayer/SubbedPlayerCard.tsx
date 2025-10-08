/* eslint-disable react/require-default-props */
import { UPDATE_ROUND } from '@/graphql/round';
import { useAppDispatch } from '@/redux/hooks';
import { IPlayer, IPlayerRankingExpRel, IRoundRelatives } from '@/types';
import updateSubbedPlayer from '@/utils/requestHandlers/updateSubbedPlayer';
import { useMutation } from '@apollo/client/react';
import Image from 'next/image';
import React, { useState } from 'react';

interface ISubbedPlayerCardProps {
  player: IPlayer;
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
  subControl?: boolean;
}

function SubbedPlayerCard({ player, currRound, roundList, subControl, teamAPlayerRanking, teamBPlayerRanking }: ISubbedPlayerCardProps) {
  const dispatch = useAppDispatch();

  const [showAction, setShowAction] = useState<boolean>(false);

  // ===== GraphQL =====
  const [mutateRound] = useMutation(UPDATE_ROUND);

  const handleRemovePlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await updateSubbedPlayer({ playerId: player._id, currRound, dispatch, mutateRound, roundList });
  };

  const rankings = [];
  if(teamAPlayerRanking) rankings.push(...teamAPlayerRanking.rankings);
  if(teamBPlayerRanking) rankings.push(...teamBPlayerRanking.rankings);
  const playerRank: number = rankings.find((p) => p.player._id === player?._id)?.rank || 0;

  return (
    <div className="small-player-card border-light p-1 flex items-center gap-x-1 relative">
      <h4 className="capitalize">{`${playerRank}. ${player.firstName} ${player.lastName}`}</h4>
      {subControl && (
        <Image alt="Option icon" className="svg-white cursor-pointer" src="/icons/dots-vertical.svg" width={16} height={16} role="presentation" onClick={() => setShowAction(!showAction)} />
      )}

      {showAction && subControl && (
        <ul className="absolute actionBox bg-black-logo text-white p-2 right-3">
          <li role="presentation" onClick={handleRemovePlayer} className="cursor-pointer">
            Remove
          </li>
        </ul>
      )}
    </div>
  );
}

export default SubbedPlayerCard;
