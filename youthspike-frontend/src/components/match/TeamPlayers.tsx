/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { IPlayerUser } from '@/types/user';
import PlayerScoreCard from './PlayerScoreCard';

// Static variables
const playersLimit: number = 5;
const touchThreshold: number = 50;
const initialStartTrim: number = 1;

function TeamPlayers({ teamPlayers }: { teamPlayers: IPlayerUser[] }) {

  // Local State
  const [cloneTeamPlayers, setCloneTeamPlayers] = React.useState<IPlayerUser[]>([]);
  const [startTrim, setStartTrim] = React.useState<number>(initialStartTrim);
  const [trimPlayers, setTrimPlayers] = React.useState<IPlayerUser[]>([]);
  const [startPosX, setStartPosX] = React.useState<number>(0);

  /*
  // Dummy Data
  const makeDummyPlayerCards = () => {
    const playerCardList = [];
    for (let i = 0; i < 10; i += 1) {
      const dummyPlayer = {
        player: { rank: i + 1 },
        firstName: `Fn-${i + 1}`,
        lastName: `Fn-${i + 1}`,
      };
      // @ts-ignore
      playerCardList.push(dummyPlayer);
    }
    // @ts-ignore
    setCloneTeamPlayers(playerCardList);
    return playerCardList;
  };
  */

  React.useEffect(() => {
    // const playerList = makeDummyPlayerCards();
    // // @ts-ignore
    // if (playerList.length > 0) setTrimPlayers(playerList.slice(initialStartTrim - 1, playersLimit));

    if (teamPlayers.length > 0){
      setCloneTeamPlayers(teamPlayers.slice());
      setTrimPlayers(teamPlayers.slice(initialStartTrim - 1, playersLimit));
    };
  }, [teamPlayers]);

  /**
   * Players list on the top and bottom to be slidable with a limit of players to be shown
   * Players those are out of limit can be swip with touch event on mobile
   * On desktop there will be a arrow button that will swip player
   */
  const shiftRight = (): void => {
    if (startTrim - 1 <= cloneTeamPlayers.length - playersLimit) {
      setTrimPlayers(cloneTeamPlayers.slice(startTrim - 1, startTrim - 1 + playersLimit));
      setStartTrim((prevState) => prevState + 1);
    }
  };
  const shiftLeft = (): void => {
    if (startTrim - 2 >= 0) {
      setTrimPlayers(cloneTeamPlayers.slice(startTrim - 2, startTrim - 2 + playersLimit));
      setStartTrim((prevState) => prevState - 1);
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
    <div className="bg-gray-900 text-gray-100 py-4">
      <div className="container px-4 mx-auto">
        <div className="player-list flex justify-between items-center">
          <button type="button" className="hidden md:block bg-transparent border-o h-full" onClick={shiftLeft}>
            <img src="/svg_icons/arrow.svg" alt="left-arrow" className="w-4" style={{ transform: 'scaleX(-1)' }} />
          </button>
          {trimPlayers &&
            trimPlayers.map((player) => (
              // @ts-ignore
              <div className="player-card w-16" key={player._id} onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler}>
                <PlayerScoreCard player={player} />
              </div>
            ))}
          <button type="button" className="hidden md:block bg-transparent border-o h-full" onClick={shiftRight}>
            <img src="/svg_icons/arrow.svg" alt="left-arrow" className="w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamPlayers;
