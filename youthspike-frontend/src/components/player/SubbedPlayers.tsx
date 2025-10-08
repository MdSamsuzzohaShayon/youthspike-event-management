import React from 'react';
import { IPlayer, IRoundRelatives } from '@/types';
import Image from 'next/image';
import { useMutation } from '@apollo/client';
import { UPDATE_ROUND } from '@/graphql/round';
import updateSubbedPlayer from '@/utils/requestHandlers/updateSubbedPlayer';
import { useAppDispatch } from '@/redux/hooks';
import { CldImage } from 'next-cloudinary';

interface ISubbedPlayersProps {
  myPlayers: IPlayer[];
  currentRound: IRoundRelatives | null;
  availablePlayerIds: string[];
  roundList: IRoundRelatives[];
}

function SubbedPlayers({ myPlayers, currentRound, availablePlayerIds, roundList }: ISubbedPlayersProps) {
  const [mutateRound] = useMutation(UPDATE_ROUND);
  const dispatch = useAppDispatch();

  const subbedPlayers = currentRound?.subs ?? [];
  const teamPlayerList = myPlayers.filter((player) => availablePlayerIds.includes(player._id) && subbedPlayers.includes(player._id));

  const handleRemoveSubb = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    await updateSubbedPlayer({
      currRound: currentRound,
      dispatch,
      mutateRound,
      playerId,
      roundList,
    });
  };

  if (teamPlayerList.length === 0) return null;

  return (
    <div className="player-list mt-4 w-full flex flex-col gap-1">
      <h3>Subbed Players</h3>
      {teamPlayerList.map((player) => (
        <div key={player._id} className="border-b border-gray-300 flex justify-between items-center w-full cursor-pointer bg-transparent">
          <div className="advanced-img w-10 h-10 rounded-full border-2 border-black-logo overflow-hidden">
            {player.profile ? (
              <CldImage crop="scale" alt={player.firstName} width="200" height="200" className="w-full overflow-hidden" src={player.profile} />
            ) : (
              <Image width={24} height={24} src="/icons/sports-man.svg" alt="sports-man" className="svg-black w-full" />
            )}
          </div>
          <p className="w-7/12 break-words capitalize">
            {player.firstName} {player.lastName}
          </p>
          <div className="w-1/12">
            <Image width={16} height={16} alt="close-button" src="/icons/close.svg" className="svg-black" role="presentation" onClick={(e) => handleRemoveSubb(e, player._id)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SubbedPlayers;
