import { IPlayer } from '@/types/player';
import React, { useState } from 'react';

interface PlayerCardProps {
  player: IPlayer;
  index: number;
}

function PlayerCard({ player, index }: PlayerCardProps) {

  const [actionOpen, setActionOpen] = useState<boolean>(false);

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }

  const handleEdit = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Edit player: ${playerId}`);
  }
  const handleMakeCaptain = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Make captain player: ${playerId}`);

  }
  const handleMakeCoCaptain = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Make co-captain player: ${playerId}`);

  }
  const handleMovePlayer = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Move player: ${playerId}`);

  }
  const handleMakeInactive = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Inactive player: ${playerId}`);

  }
  const handleDelete = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Delete player: ${playerId}`);

  }

  return (
    <li className='w-full bg-gray-700 py-2 flex justify-between items-center gap-1 relative' style={{ minHeight: '6rem' }}>
      <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 z-10 rounded-lg`}>
        <li role="presentation" onClick={(e) => handleEdit(e, player._id)} > Edit</li>
        <li role="presentation" onClick={(e) => handleMakeCaptain(e, player._id)} > Make Captain</li>
        <li role="presentation" onClick={(e) => handleMakeCoCaptain(e, player._id)} > Make Co-captain</li>
        <li role="presentation" onClick={(e) => handleMovePlayer(e, player._id)} > Move Player</li>
        <li role="presentation" onClick={(e) => handleMakeInactive(e, player._id)} > Make Inactive</li>
        <li role="presentation" onClick={(e) => handleDelete(e, player._id)} >Delete</li>
      </ul>

      <input type="checkbox" name="player-select" id="option" className='w-1/12' />

      <div className="img-wrapper h-full w-4/12 flex justify-between items-center gap-1">
        <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />
        <div className="player-name flex flex-col w-full">
          <h3 className='break-words'>{player.firstName + ' ' + player.lastName}</h3>
          {player?.captainofteam && <p className='text-yellow-500 uppercase'>Captain</p>}
        </div>
      </div>

      <div className="rank-box h-10 w-1/12 flex flex-col">
        <h3 className='bg-yellow-500 w-8 h-8 flex justify-center items-center text-base'>
          {/* {player.rank} */}
          {index + 1}
        </h3>
        <p>Rank</p>
      </div>

      <div className="text-box w-5/12">
        <div className="w-full">
          <p className='break-words' >7676-783-8263</p>
          <p className='break-words' >{player.email}</p>
          <p className='break-words' >2-3 / +3 games</p>
        </div>
      </div>

      <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 svg-white' role="presentation" onClick={handleOpenAction} />
    </li>
  )
}

export default PlayerCard;