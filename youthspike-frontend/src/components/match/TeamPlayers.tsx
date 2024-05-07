/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { IPlayer } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { screen } from '@/utils/constant';
import { useAppSelector } from '@/redux/hooks';
import PlayerScoreCard from './PlayerScoreCard';

interface ITeamPlayersProps {
  teamPlayers: IPlayer[];
  screenWidth: number;
}

// Static variables
const playersLimit: number = 5;
const touchThreshold: number = 50;
const initialStartTrim: number = 0;

function TeamPlayers({ teamPlayers, screenWidth }: ITeamPlayersProps) {
  // Global States
  const { myTeamE } = useAppSelector((state) => state.matches);

  // Local State
  const [cloneTeamPlayers, setCloneTeamPlayers] = React.useState<IPlayer[]>([]);
  const [startTrim, setStartTrim] = React.useState<number>(initialStartTrim);
  const [trimPlayers, setTrimPlayers] = React.useState<IPlayer[]>([]);
  const [startPosX, setStartPosX] = React.useState<number>(0);

  React.useEffect(() => {
    if (teamPlayers.length > 0) {
      setCloneTeamPlayers(teamPlayers.slice());
      setTrimPlayers(teamPlayers.slice(initialStartTrim, playersLimit));
    }
  }, [teamPlayers]);

  /**
   * Players list on the top and bottom to be slidable with a limit of players to be shown
   * Players those are out of limit can be swip with touch event on mobile
   * On desktop there will be a arrow button that will swip player
   */
  const shiftRight = (): void => {
    if (startTrim <= cloneTeamPlayers.length - playersLimit) {
      const newTrimStart = startTrim + 1;
      setTrimPlayers(cloneTeamPlayers.slice(newTrimStart, playersLimit + newTrimStart));
      setStartTrim(newTrimStart);
    }
  };
  const shiftLeft = (): void => {
    if (startTrim - 1 >= 0) {
      const newTrimStart = startTrim - 1;
      setTrimPlayers(cloneTeamPlayers.slice(newTrimStart, newTrimStart + playersLimit));
      setStartTrim(newTrimStart);
    }
  };
  const touchStartHandler = (e: React.TouchEvent) => {
    setStartPosX(e.touches[0].clientX);
  };
  const touchEndHandler = (e: React.TouchEvent) => {
    if (cloneTeamPlayers.length <= playersLimit) return;
    const newEndPositionX = e.changedTouches[0].clientX;
    if (startPosX - newEndPositionX > touchThreshold) {
      shiftRight();
    } else if (newEndPositionX - startPosX > touchThreshold) {
      shiftLeft();
    }
  };

  return (
    <div className="bg-gray-900 text-white py-4">
      <div className="container px-4 mx-auto">
        <div className="player-list flex justify-between items-center">
          {screenWidth > screen.xs && (
            <button type="button" className="bg-transparent border-o h-full" onClick={shiftLeft}>
              <img src="/icons/right-arrow.svg" alt="left-arrow" className="w-8 svg-white" style={{ transform: 'scaleX(-1)' }} />
            </button>
          )}

          {trimPlayers &&
            trimPlayers.map((player) => (
              // @ts-ignore
              <div className="player-card w-16" key={player._id} onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler}>
                <PlayerScoreCard player={player} dark teamPlayer={ETeamPlayer.TA_PA} screenWidth={screenWidth} myTeamE={myTeamE} />
              </div>
            ))}
          {screenWidth > screen.xs && (
            <button type="button" className="bg-transparent border-o h-full" onClick={shiftRight}>
              <img src="/icons/right-arrow.svg" alt="left-arrow" className="w-8 svg-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamPlayers;
