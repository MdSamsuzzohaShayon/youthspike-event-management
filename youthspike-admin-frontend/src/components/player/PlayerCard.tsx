import cld from '@/config/cloudinary.config';
import { UPDATE_PLAYER } from '@/graphql/players';
import { UPDATE_TEAM } from '@/graphql/teams';
import { IPlayer, IPlayerExpRel, PlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

interface PlayerCardProps {
  player: IPlayerExpRel;
  index: number;
  teamId: string | null;
  eventId: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  touchDragStart: (index: number) => void;
  touchDragEnter: (index: number) => void;
  touchDragEnd: (index: number, playerId: string) => void;
  touchMove: (e: TouchEvent) => void;
  showRank?: boolean;
  rankControls?: boolean;
  isAssigned?: boolean;
}

function PlayerCard({ player, index, teamId, eventId, setIsLoading, touchDragStart, touchDragEnter, touchDragEnd, touchMove, showRank, rankControls, isAssigned }: PlayerCardProps) {

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const [mutatePlayer] = useMutation(UPDATE_PLAYER);

  const playerLiEl = useRef<HTMLLIElement | null>(null);


  /**
   * Actions for players
   */
  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }

  const handleEdit = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Edit player: ${playerId}`);
  }
  const handleMakeCaptain = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    try {
      setIsLoading(true);
      const changeCaptainRes = await mutateTeam({ variables: { input: { captain: playerId }, teamId } });
      console.log(changeCaptainRes);

    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
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
  const handleChangeStatus = async (e: React.SyntheticEvent, newStatus: PlayerStatus, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    try {
      setIsLoading(true);
      await mutatePlayer({
        variables: {
          input: { status: newStatus },
          playerId
        }
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }

  }
  const handleDelete = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Delete player: ${playerId}`);
  }

  /**
   * Drag or touch event for players rankings
   */
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    setIsDragging(true);
    touchDragStart(index,);
  };
  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>) => {
    touchDragEnter(index);
  };
  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    setIsDragging(false);
    touchDragEnd(index, player._id);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchDragStart(index)
  }
  const handleTouchEnd = (e: TouchEvent) => {
    touchDragEnd(index, player._id)
  }
  const handleTouchMove = (e: TouchEvent) => {
    touchMove(e);
  }

  useEffect(() => {
    const liEl = playerLiEl.current;
    if (liEl) {
      liEl.addEventListener("touchstart", handleTouchStart, { passive: false });
      liEl.addEventListener("touchmove", handleTouchMove, { passive: false });
      liEl.addEventListener("touchend", handleTouchEnd, { passive: false });

      return () => {
        liEl.removeEventListener("touchstart", handleTouchStart);
        liEl.removeEventListener("touchmove", handleTouchMove);
        liEl.removeEventListener("touchend", handleTouchEnd);
      }
    }
  }, []);

  return (
    <li ref={playerLiEl} className={`w-full ${isAssigned ? "bg-gray-500": "bg-gray-700 "} py-2 flex justify-between items-center gap-1 relative rounded-md ${isDragging ? '' : 'opacity-100'}`} draggable={rankControls ?? false} style={{ minHeight: '6rem' }}
      onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} onDrop={handleDragEnter} >
      <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 md:right-20 z-10 rounded-lg`}>
        <li role="presentation" > <Link href={`/${eventId}/players/${player._id}`}>Edit</Link></li>
        {rankControls && (<React.Fragment>
          <li role="presentation" onClick={(e) => handleMakeCaptain(e, player._id)} > Make Captain</li>
          <li role="presentation" onClick={(e) => handleMakeCoCaptain(e, player._id)} > Make Co-captain</li>
        </React.Fragment>)}
        <li role="presentation" onClick={(e) => handleMovePlayer(e, player._id)} > Move Player</li>
        {player.status === PlayerStatus.ACTIVE ? (<li role="presentation" onClick={(e) => handleChangeStatus(e, PlayerStatus.INACTIVE, player._id)} > Make Inactive</li>) : (<li role="presentation" onClick={(e) => handleChangeStatus(e, PlayerStatus.ACTIVE, player._id)} > Make Active</li>)}
        <li role="presentation" onClick={(e) => handleDelete(e, player._id)} >Delete</li>
      </ul>

      <input type="checkbox" name="player-select" id="option" className='w-1/12' />

      <div className="img-wrapper h-full w-4/12 flex justify-between items-center gap-1">
        {/* <AdvancedImage className="w-8" cldImg={cld.image(ldo?.logo)} /> */}
        {player.profile ? <AdvancedImage className="w-10 h-10 border-4 border-yellow-500 rounded-full" cldImg={cld.image(player.profile)} /> : <img src="/icons/sports-man.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full svg-white" />}
        <div className="player-name flex flex-col w-full">
          <h3 className='break-words capitalize'>{player.firstName + ' ' + player.lastName}</h3>
          {player?.captainofteams && player?.captainofteams.length > 0 && <p className='text-yellow-500 uppercase'>Captain</p>}
        </div>
      </div>

      {showRank && player?.rank && (
        <div className="rank-box h-6 w-6 flex flex-col">
          <h3 className='bg-yellow-500 w-8 h-8 flex justify-center items-center text-base'>
            {player?.rank}
          </h3>
          <p>Rank</p>
        </div>
      )}

      <div className="text-box w-5/12">
        <div className="w-full">
          <p className='break-words' >{player.phone ? player.phone : 'Phone: N/A'}</p>
          <p className='break-words' >{player.email}</p>
          <p className='break-words' >2-3 / +3 games</p>
        </div>
      </div>

      <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 svg-white' role="presentation" onClick={handleOpenAction} />
    </li>
  )
}

export default PlayerCard;