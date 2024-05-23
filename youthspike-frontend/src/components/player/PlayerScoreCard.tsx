/* eslint-disable react/require-default-props */
import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { useAppSelector } from '@/redux/hooks';
import { IPlayer } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { screen } from '@/utils/constant';
import { fsToggle } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface IPlayerScoreCard {
  player: IPlayer | null;
  screenWidth: number;
  myTeamE: ETeam;
  onTop?: boolean;
  teamPlayer?: ETeamPlayer;
  // eslint-disable-next-line no-unused-vars
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string) => void;
  // eslint-disable-next-line no-unused-vars
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
}

function PlayerScoreCard({ player, onTop, teamPlayer, evacuatePlayer, dropdownPlayer, screenWidth, myTeamE }: IPlayerScoreCard) {
  const user = useUser();
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { closePSCAvailable: cpsca } = useAppSelector((state) => state.matches); // CPSCA = Close Player Score Card Available

  // eslint-disable-next-line no-unused-vars
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

  const shouldShowAddPlayer =
    !player &&
    user.token &&
    evacuatePlayer &&
    currentRoom &&
    currentRound &&
    ((currentRound.teamAProcess === EActionProcess.CHECKIN && currentRound.teamBProcess === EActionProcess.CHECKIN) ||
      (currentRound.teamAProcess === EActionProcess.CHECKIN && currentRound.teamBProcess === EActionProcess.LINEUP) ||
      (currentRound.teamAProcess === EActionProcess.LINEUP && currentRound.teamBProcess === EActionProcess.CHECKIN));

  useEffect(() => {
    let fn = true;
    // Check all nets fills or not
    for (let i = 0; i < currentRoundNets.length; i += 1) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) {
          fn = false;
        }
      } else if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) {
        fn = false;
      }
    }
    setFillNets(fn);
  }, [currentRoundNets]);

  const renderSelectedPlayer = (p: IPlayer | null): React.ReactNode => {
    if (p && p?.profile) return <AdvancedImage className="w-full h-full object-center object-cover" cldImg={cld.image(p.profile)} onClick={handleDropDown} />;
    if (!p && dropdownPlayer && shouldShowAddPlayer)
      return (
        <div className="w-full h-full flex justify-center items-center">
          <Image
            width={100}
            height={100}
            src="/icons/plus.svg"
            alt="random-img"
            className={`${onTop ? 'svg-white' : 'svg-black'} w-5/6 md:h-full object-center object-cover`}
            role="presentation"
            onClick={handleDropDown}
          />
        </div>
      );
    return <Image width={100} height={100} src="/empty-img.jpg" alt="random-img" className="w-full h-full object-center object-cover" role="presentation" onClick={handleDropDown} />;
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {player && (
        <p className={`rank w-6 h-6 absolute ${onTop ? 'top-0' : 'bottom-0'} left-0 rounded-full bg-gray-100 text-black z-10 flex justify-center items-center border border-black-logo`}>
          {player ? player.rank : 0}
        </p>
      )}
      <div className={`wrapper mt-1 mx-1 border border-yellow rounded-lg overflow-hidden flex ${onTop ? 'flex-col' : 'flex-col-reverse'}`}>
        <div className="p-rank bg-yellow-400 w-full flex flex-wrap items-center justify-end py-1">
          <p className="p-name text-c-sm uppercase leading-4 text-black-logo text-end font-bold mr-1">{!player ? 'N/A' : `${player?.firstName} ${player?.lastName}`}</p>
        </div>

        <div className={`p-img-wrap cursor-pointer relative w-full ${screenWidth > screen.xs ? 'h-20' : 'h-24 '}`}>
          {shouldShowEvacuateButton && (
            <div className="absolute top-1 right-1 w-4 bg-black-logo rounded-full">
              {myTeamE === ETeam.teamA && cpsca
                ? !currentRound?.teamAScore && (
                    <Image width={12} height={12} src="/icons/close.svg" className="w-full h-full svg-white" alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
                  )
                : !currentRound?.teamBScore &&
                  cpsca && (
                    <Image width={12} height={12} src="/icons/close.svg" className="w-full h-full svg-white" alt="cross" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
                  )}
            </div>
          )}

          {renderSelectedPlayer(player)}
        </div>
      </div>
    </div>
  );
}

export default PlayerScoreCard;
