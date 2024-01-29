/* eslint-disable no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { useAppSelector } from '@/redux/hooks';
import { IPlayer, IRoom } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { EActionProcess } from '@/types/room';
import { AdvancedImage } from '@cloudinary/react';
import { profile } from 'console';
import React from 'react';

interface IPalyerScoreCard {
  player: IPlayer | null;
  teamPlayer: ETeamPlayer;
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string) => void;
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
  dark: boolean;
}

function PlayerScoreCard({ dark, player, teamPlayer, evacuatePlayer, dropdownPlayer }: IPalyerScoreCard) {
  const user = useUser();

  const currentRoom = useAppSelector((state) => state.rooms.current);
  const {current: currentRound} = useAppSelector((state)=> state.rounds);

  const handleDropDown = (e: React.SyntheticEvent) => {
    // Show drop down box
    if (dropdownPlayer) dropdownPlayer(e, teamPlayer);
  };

  const handleEvacuatePlayer = (e: React.SyntheticEvent, playerId: string) => {
    if (evacuatePlayer) evacuatePlayer(teamPlayer, playerId);
  };
  return (
    <>
      <div className="p-img-wrap relative w-full h-24">

        {player && user.token && evacuatePlayer && currentRoom && currentRound
          && (currentRound.teamAProcess === EActionProcess.LINEUP || currentRound.teamBProcess === EActionProcess.LINEUP || currentRound.teamAProcess === EActionProcess.CHECKIN || currentRound.teamBProcess === EActionProcess.CHECKIN)
          && <div className="absolute top-1 right-1 w-4 bg-gray-900 rounded-full"> <img src="/icons/close.svg"
            className='w-full h-full svg-white' alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} /> </div>}

        {player?.profile ? <AdvancedImage className="w-full h-full object-center object-cover" cldImg={cld.image(player.profile)} onClick={handleDropDown} /> : (<img
          src="/empty-img.jpg"
          alt="random-img"
          className="w-full h-full object-center object-cover"
          role="presentation"
          onClick={handleDropDown}
        />)}

        <div className="img-left-txt absolute bg-slate-100/75 text-gray-900 bottom-0 left-0 text-xs w-7 text-center">
          <span>1-1</span>
          <p>R</p>
        </div>
        <div className="img-right-txt absolute bg-slate-100/75 text-gray-900 bottom-0 right-0 text-xs w-7 text-center">
          <span>1-1</span>
          <p>S</p>
        </div>
      </div>
      <div className="p-name-rank w-full flex h-9">
        <div className={`rank w-4 h-full bg-yellow-500 text-gray-100 text-lg flex justify-center text-center items-center`}>{player ? player.rank : 0}</div>
        <p className={`name flex justify-center text-center items-center w-12 leading-3 capitalize ${dark ? 'text-gray-100' : 'text-gray-900'}`} style={{ fontSize: '0.6rem' }}>
          {!player ? 'Not Selected' : `${player?.firstName} ${player?.lastName}`}
        </p>
      </div>
    </>
  );
}

export default PlayerScoreCard;