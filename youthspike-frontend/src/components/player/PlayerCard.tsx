/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import cld from '@/config/cloudinary.config';
import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import { IPlayerRecord } from '@/types/player';
import { imgW } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useRef } from 'react';

interface PlayerCardProps {
  player: IPlayerRecord;
  showRank?: boolean;
}

function PlayerCard({ player, showRank }: PlayerCardProps) {
  const { ldoIdUrl } = useLdoId();
  const params = useParams();
  const user = useUser();
  const playerLiEl = useRef<HTMLLIElement | null>(null);

  const handleContextMenu = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default context menu from showing
  };

  return (
    <li
      ref={playerLiEl}
      onContextMenu={handleContextMenu}
      className="player-card w-full bg-gray-700 py-4 px-4 flex flex-col md:flex-row items-center gap-4 rounded-lg shadow-md"
      style={{ minHeight: '6rem' }}
    >
      {/* Player Profile and Details */}
      <div className="flex items-center w-full md:w-7/12">
        <div className="advanced-img w-20 h-20 md:w-24 md:h-24 border border-yellow-400 rounded-lg overflow-hidden">
          {player.profile ? (
            <AdvancedImage className="w-full h-full object-cover" cldImg={cld.image(player.profile)} />
          ) : (
            <Image width={200} height={200} src="/icons/sports-man.svg" alt="Player Avatar" className="svg-white w-full h-full object-contain" />
          )}
        </div>
        <div className="player-details flex flex-col pl-4 text-white">
          <h3 className="text-lg font-bold capitalize">{`${player.firstName} ${player.lastName}`}</h3>
          {player.teams && player.teams?.length > 0 && typeof player.teams[0] === 'object' && <p className="text-yellow-400 uppercase text-sm">{player.teams[0].name}</p>}
          {player?.captainofteams?.length > 0 && <p className="text-yellow-400 uppercase text-sm">Captain</p>}
        </div>
      </div>

      {/* Player Rank */}
      <div className="flex flex-col items-center w-full md:w-2/12 text-white">
        {showRank && player.rank && (
          <>
            <div className="rank-circle bg-yellow-400 text-black w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold">{player.rank}</div>
            <p className="text-sm mt-2">Rank</p>
          </>
        )}
      </div>

      {/* Player Record */}
      {player && (
        <div className="record-box w-full md:w-3/12 text-center md:text-left text-white">
          <h3 className="text-sm font-bold mb-2">Matches</h3>
          <div className="text-xs md:text-sm space-y-1">
            <p>
              <span className="font-medium">Running:</span> {player.running}
            </p>
            <p>
              <span className="font-medium">Wins:</span> {player.wins}
            </p>
            <p>
              <span className="font-medium">Losses:</span> {player.losses}
            </p>
          </div>
        </div>
      )}

      {/* Edit Button */}
      {user.token && (
        <div className="edit-btn flex justify-end w-full md:w-2/12">
          <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/players/${player._id}/${ldoIdUrl}`} className="flex items-center justify-center p-2 bg-gray-600 hover:bg-gray-500 rounded-full">
            <Image src="/icons/edit.svg" height={imgW.logo} width={imgW.logo} alt="Edit" className="svg-white" />
          </Link>
        </div>
      )}
    </li>
  );
}

export default PlayerCard;
