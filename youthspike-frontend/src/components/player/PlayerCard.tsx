import cld from '@/config/cloudinary.config';
import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import { IPlayer } from '@/types/player';
import { imgW } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef } from 'react';

interface PlayerCardProps {
  player: IPlayer;
  rank: number | null;
}

function PlayerCard({ player, rank }: PlayerCardProps) {
  const {ldoIdUrl} = useLdoId();
  const params = useParams();
  const user = useUser();
  const playerLiEl = useRef<HTMLLIElement | null>(null);

  return (
    <li ref={playerLiEl} className="player-card w-full bg-gray-700 py-2 flex justify-between items-center gap-2 rounded-md" style={{ minHeight: '6rem' }}>
      <div className="w-10/12 px-2 flex justify-between items-center">
        <div className="w-5/6 flex justify-start gap-x-2 items-center">
          <div className="advanced-img w-20 h-24 border border-yellow rounded-lg border-4">
            {player.profile ? (
              <AdvancedImage className="w-full h-full " cldImg={cld.image(player.profile)} />
            ) : (
              <Image width={200} height={200} src="/icons/sports-man.svg" alt="" className="svg-white w-full h-full" />
            )}
          </div>
          <div className="player-name flex flex-col">
            <h3 className="break-words">{`${player.firstName} ${player.lastName}`}</h3>
            {player.teams && player.teams.length > 0 && <p className="text-yellow-400 uppercase">{player.teams[0].name}</p>}
            {player?.captainofteams && player.captainofteams.length > 0 && <p className="text-yellow-400 uppercase">Captain</p>}
          </div>
        </div>

        <div className="rank-box h-10 w-1/12 flex flex-col">
          {rank && (
            <>
              <h3 className="bg-yellow-logo text-black w-8 h-8 flex justify-center items-center text-base">{rank}</h3>
              <p>Rank</p>
            </>
          )}
        </div>
      </div>
      <div className="w-2/12 pe-2">
        {user.token && (
          <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/players/${player._id}/${ldoIdUrl}`} className="pe-2 flex items-center justify-end">
            <Image src="/icons/edit.svg" height={imgW.logo} width={imgW.logo} alt="Exit Button" className="svg-white" />
          </Link>
        )}
      </div>
    </li>
  );
}

export default PlayerCard;
