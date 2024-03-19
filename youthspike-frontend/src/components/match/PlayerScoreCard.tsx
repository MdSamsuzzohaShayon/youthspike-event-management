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
import React, { useEffect, useState } from 'react';


interface IPlayerScoreCard {
  player: IPlayer | null;
  teamPlayer?: ETeamPlayer;
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
  const { currentRoundNets } = useAppSelector((state) => state.nets);


  const [fillNets, setFillNets] = useState<boolean>(false);

  const handleDropDown = (e: React.SyntheticEvent) => {
    if (dropdownPlayer && teamPlayer) dropdownPlayer(e, teamPlayer);
  };

  const handleEvacuatePlayer = (e: React.SyntheticEvent, playerId: string) => {
    if (evacuatePlayer && teamPlayer) evacuatePlayer(teamPlayer, playerId);
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

  useEffect(() => {
    let fn = true;
    for (let i = 0; i < currentRoundNets.length; i++) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) {
          fn = false;
        }
      } else {
        if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) {
          fn = false;
        }
      }
    }
    setFillNets(fn);
  }, [currentRoundNets]);

  return (
    <React.Fragment>
      <div className={`p-img-wrap relative w-full ${screenWidth > screen.xs ? 'h-20' : 'h-24 '}`}>
        {shouldShowEvacuateButton && (
          <div className="absolute top-1 right-1 w-4 bg-gray-900 rounded-full">
            {myTeamE === ETeam.teamA && !fillNets && !dark
              ? (!currentRound.teamAScore && (
                <img src="/icons/close.svg" className='w-full h-full svg-white' alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
              ))
              : !currentRound.teamBScore && !fillNets && !dark && (
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
      </div>

      <div className={`p-name-rank w-full flex ${screenWidth > screen.xs ? 'h-7' : 'h-9'}`}>
        <div className="rank w-4 h-full bg-yellow-400 text-gray-900 text-lg flex justify-center items-center" style={fsToggle(screenWidth)}>
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