import cld from '@/config/cloudinary.config';
import { IPlayer } from '@/types/player';
import { AdvancedImage } from '@cloudinary/react';
import { useRef } from 'react';

interface PlayerCardProps {
  player: IPlayer;
}

function PlayerCard({ player }: PlayerCardProps) {
  const playerLiEl = useRef<HTMLLIElement | null>(null);

  return (
    <li ref={playerLiEl} className="w-full bg-gray-700 py-2 flex justify-between items-center gap-2 rounded-md" style={{ minHeight: '6rem' }}>
      {/* {player.profile ? <AdvancedImage className="w-10 h-10 border-4 border-yellow-400 rounded-full ml-2" cldImg={cld.image(player.profile)} /> : <img src="/icons/sports-man.svg" alt="" className="w-10 h-10 border-4 border-yellow-400 rounded-full svg-white ml-2" />} */}
      <div className="advanced-img w-20 h-24 border border-yellow rounded-lg border-4">
        {player.profile ? <AdvancedImage className="w-full h-full " cldImg={cld.image(player.profile)} /> : <img src="/icons/sports-man.svg" alt="" className="svg-white w-full h-full" />}
      </div>
      <div className="player-name flex flex-col w-full">
        <h3 className="break-words">{`${player.firstName} ${player.lastName}`}</h3>
        {player.teams && player.teams.length > 0 && <p className="text-yellow-400 uppercase">{player.teams[0].name}</p>}
        {player?.captainofteams && player.captainofteams.length > 0 && <p className="text-yellow-400 uppercase">Captain</p>}
      </div>

      {player?.rank && (
        <div className="rank-box h-10 w-1/12 flex flex-col">
          <h3 className="bg-yellow-400 w-8 h-8 flex justify-center items-center text-base">{player?.rank}</h3>
          <p>Rank</p>
        </div>
      )}
    </li>
  );
}

export default PlayerCard;
