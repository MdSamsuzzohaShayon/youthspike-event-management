/* eslint-disable no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { useAppSelector } from '@/redux/hooks';
import { IPlayer, IRoom } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { netSize, screen } from '@/utils/constant';
import { fsToggle } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';


interface IPlayerScoreCard {
  player: IPlayer | null;
  teamPlayer: ETeamPlayer;
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string) => void;
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
  dark: boolean;
  screenWidth: number;
  myTeamE: ETeam;
}

function PlayerScoreCard({ dark, player, teamPlayer, evacuatePlayer, dropdownPlayer, screenWidth, myTeamE }: IPlayerScoreCard) {
  const user = useUser();
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { current: currentRound } = useAppSelector((state) => state.rounds);

  const handleDropDown = (e: React.SyntheticEvent) => {
    if (dropdownPlayer) dropdownPlayer(e, teamPlayer);
  };

  const handleEvacuatePlayer = (e: React.SyntheticEvent, playerId: string) => {
    if (evacuatePlayer) evacuatePlayer(teamPlayer, playerId);
  };

  const shouldShowEvacuateButton =
    player &&
    user.token &&
    evacuatePlayer &&
    currentRoom &&
    currentRound &&
    (currentRound.teamAProcess === EActionProcess.LINEUP ||
      currentRound.teamBProcess === EActionProcess.LINEUP ||
      currentRound.teamAProcess === EActionProcess.CHECKIN ||
      currentRound.teamBProcess === EActionProcess.CHECKIN);

  return (
    <React.Fragment>
      <div className={`p-img-wrap relative w-full ${screenWidth > screen.xs ? 'h-20' : 'h-24'}`}>
        {shouldShowEvacuateButton && (
          <div className="absolute top-1 right-1 w-4 bg-gray-900 rounded-full">
            {myTeamE === ETeam.teamA && !dark ? (!currentRound.teamAScore && (
              <img src="/icons/close.svg" className='w-full h-full svg-white' alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
            )) : !currentRound.teamBScore && !dark && (
              <img src="/icons/close.svg" className='w-full h-full svg-white' alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
            )}
          </div>
        )}

        {player?.profile ? (
          <AdvancedImage className="w-full h-full object-center object-cover" cldImg={cld.image(player.profile)} onClick={handleDropDown} />
        ) : (
          <img
            src="/empty-img.jpg"
            alt="random-img"
            className="w-full h-full object-center object-cover"
            role="presentation"
            onClick={handleDropDown}
          />
        )}

        {/* {['left', 'right'].map((position) => (
          <div key={position} className={`img-${position}-txt absolute bg-slate-100/75 text-gray-900 bottom-0 ${position}-0 w-7 z-20 text-center flex flex-col`} style={fsToggle(screenWidth)}>
            <span>1-1</span>
            <span>{position === 'left' ? 'R' : 'S'}</span>
          </div>
        ))} */}
        <div className={`img-left-txt absolute bg-slate-100/75 text-gray-900 bottom-0 left-0 w-7 z-10 text-center flex flex-col`} style={fsToggle(screenWidth)}>
          <span>1-1</span>
          <span>R</span>
        </div>
        <div className={`img-right-txt absolute bg-slate-100/75 text-gray-900 bottom-0 right-0 w-7 z-10 text-center flex flex-col`} style={fsToggle(screenWidth)}>
          <span>1-1</span>
          <span>S</span>
        </div>
      </div>

      <div className={`p-name-rank w-full flex ${screenWidth > screen.xs ? 'h-7' : 'h-9'}`}>
        <div className="rank w-4 h-full bg-yellow-500 text-gray-100 text-lg flex justify-center items-center" style={fsToggle(screenWidth)}>
          {player ? player.rank : 0}
        </div>
        <p className={`name flex justify-center items-center w-12 leading-3 capitalize break-words ${dark ? 'text-gray-100' : 'text-gray-900'}`} style={fsToggle(screenWidth)}>
          {!player ? 'N/A' : `${player?.firstName} ${player?.lastName}`}
        </p>
      </div>
    </React.Fragment>
  );
}

export default PlayerScoreCard;