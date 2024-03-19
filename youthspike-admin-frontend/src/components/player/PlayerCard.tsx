import cld from '@/config/cloudinary.config';
import { UPDATE_PLAYER } from '@/graphql/players';
import { GET_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { IPlayer, IPlayerExpRel, EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { IOption, ITeam } from '@/types';

interface PlayerCardProps {
  player: IPlayerExpRel;
  index: number;
  teamId?: string | null;
  eventId: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  touchDragStart: (index: number) => void;
  touchDragEnter: (index: number) => void;
  touchDragEnd: (index: number, playerId: string) => void;
  touchMove: (e: TouchEvent, index: number) => void;
  showRank?: boolean;
  rankControls?: boolean;
  isAssigned?: boolean;
  divisionList?: IOption[];
  teamList?: ITeam[];
}

function PlayerCard({ player, index, teamId, eventId, setIsLoading, touchDragStart, touchDragEnter, touchDragEnd, touchMove, showRank, rankControls, divisionList, teamList }: PlayerCardProps) {

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);
  const [newTeamId, setNewTeamId] = useState<null | string>(null);

  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation(UPDATE_PLAYER);

  const playerLiEl = useRef<HTMLDivElement | null>(null);


  // ====== Actions for players  ====== 
  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }

  const handleEdit = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Edit player: ${playerId}`);
  }

  const makeCaptainOrCoCaptain = async (input: { captain?: string, cocaptain?: string }) => {
    setActionOpen(prevState => !prevState);
    try {
      setIsLoading(true);
      await mutateTeam({ variables: { input, teamId, eventId } });
      await client.refetchQueries({ include: [GET_A_TEAM] });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }
  const handleMakeCaptain = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    makeCaptainOrCoCaptain({ captain: playerId });
  }
  const handleMakeCoCaptain = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    makeCaptainOrCoCaptain({ cocaptain: playerId });
  }
  const handleMovePlayerBox = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMovePlayer(true);
    setActionOpen(prevState => !prevState);
  }
  const handleMovePlayer = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      await mutatePlayer({
        variables: {
          input: { team: newTeamId, playerTeamId: teamId },
          playerId
        }
      });
      await client.refetchQueries({ include: [GET_A_TEAM] });
    } catch (error) {
      console.log(error);
    }
  }
  const handleChangeStatus = async (e: React.SyntheticEvent, newStatus: EPlayerStatus, playerId: string) => {
    e.preventDefault();

    setActionOpen(prevState => !prevState);
    try {
      await mutatePlayer({
        variables: {
          input: { status: newStatus, playerTeamId: teamId },
          playerId
        }
      });
      await client.refetchQueries({ include: [GET_A_TEAM] });
    } catch (error) {
      console.log(error);
    }

  }
  const handleDelete = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
    console.log(`Delete player: ${playerId}`);
  }

  // ====== Change events ======
  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!teamList) return;
    const inputEl = e.target as HTMLSelectElement;
    const dl: IOption[] = [];
    for (let i = 0; i < teamList.length; i += 1) {
      if (teamList[i].division.trim().toLowerCase() === inputEl.value.trim().toLowerCase()) {
        dl.push({ text: teamList[i].name, value: teamList[i]._id });
      }
    }
    setTeamOptions(dl);
  }

  const handleTeamChange = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setNewTeamId(inputEl.value);
  }

  // ====== Drag or touch event for players rankings ======
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if(!rankControls) return;
    setIsDragging(true);
    touchDragStart(index,);
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if(!rankControls) return;
    touchDragEnter(index);
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if(!rankControls) return;
    setIsDragging(false);
    touchDragEnd(index, player._id);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if(!rankControls) return;
    touchDragStart(index)
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    if(!rankControls) return;
    touchDragEnd(index, player._id)
  }
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if(!rankControls) return;

    // ===== Find out index for dropping element =====
    const touchY = e.touches[0].clientY; // Get the Y coordinate of the touch event
    const playerMobileEls = document.querySelectorAll('.mobile-draggable-element');
    let newIndex = -1;
    playerMobileEls.forEach((element, i) => {
      const rect = element.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        newIndex = i;
      }
    });
    touchMove(e, newIndex);
  };
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
    <React.Fragment>
      <li className={`w-full flex justify-between items-center ${!player?.teams || player?.teams.length === 0 ? "bg-gray-700 " : "bg-gray-500"} py-2 relative rounded-md ${isDragging ? '' : 'opacity-100'}`} style={{ minHeight: '6rem' }} >


        {/* Draggable element start  */}
        <div className="draggable-element w-11/12 flex justify-between items-center" draggable={rankControls ? true : false} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} onDrop={handleDragEnter}  >
          <input type="checkbox" name="player-select" id="option" className='w-1/12' />

          <div ref={playerLiEl} className="mobile-draggable-element w-11/12 flex justify-between items-center gap-1">
            <div className="img-wrapper h-full w-5/12 flex justify-between items-center gap-1">
              {player.profile ? <AdvancedImage className="w-10 h-10 border-4 border-yellow-400 rounded-full" cldImg={cld.image(player.profile)} /> : <img src="/icons/sports-man.svg" alt="" className="w-10 h-10 border-4 border-yellow-400 rounded-full svg-white" />}
              <div className="player-name flex flex-col w-full">
                <h3 className='break-words w-full capitalize'>{player.firstName + ' ' + player.lastName}</h3>
                {player?.captainofteams && player?.captainofteams.length > 0 && <p className='text-yellow-400 uppercase'>Captain</p>}
                {player?.cocaptainofteams && player?.cocaptainofteams.length > 0 && <p className='text-yellow-400 uppercase'>Co-Captain</p>}
                <p className='text-yellow-400 uppercase'>{!player?.teams || player?.teams.length === 0 ? "Unassigned" : 'Assigned'}</p>
              </div>
            </div>

            {showRank && player?.rank && (
              <div className="rank-box h-6 w-6 flex flex-col items-center">
                <h3 className='bg-yellow-400 w-8 h-8 flex justify-center items-center text-base'>
                  {player?.rank}
                </h3>
                <p>Rank</p>
              </div>
            )}

            <div className="text-box w-5/12">
              <div className="w-full flex flex-col justify-center items-end">
                <p className='break-words w-full text-end' >{player.phone ? player.phone : 'Phone: N/A'}</p>
                <p className='break-words w-full text-end' >{player.email}</p>
                <p className='break-words w-full text-end' >2-3 / +3 games</p>
              </div>
            </div>
          </div>


        </div>
        {/* Draggable element End  */}

        {/* Operation menu start  */}
        <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 md:right-20 z-10 rounded-lg`}>
          <li role="presentation" > <Link href={`/${eventId}/players/${player._id}`}>Edit</Link></li>
          {rankControls && player.email && player.email.trim() !== '' && (<React.Fragment>
            <li role="presentation" onClick={(e) => handleMakeCaptain(e, player._id)} > Make Captain</li>
            <li role="presentation" onClick={(e) => handleMakeCoCaptain(e, player._id)} > Make Co-captain</li>
          </React.Fragment>)}
          <li role="presentation" onClick={handleMovePlayerBox} > Move Player</li>
          {player.status === EPlayerStatus.ACTIVE ? (<li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.INACTIVE, player._id)} > Make Inactive</li>) : (<li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.ACTIVE, player._id)} > Make Active</li>)}
          <li role="presentation" onClick={(e) => handleDelete(e, player._id)} >Delete</li>
        </ul>
        <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 svg-white' role="presentation" onClick={handleOpenAction} />
        {/* Operation menu ende  */}
      </li>
      {/* && user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director)  */}
      {movePlayer && (
        <div className="w-full move-team w-full p-2 bg-gray-800 flex flex-col items-start justify-end relative">
          <button className="close" onClick={(e) => setMovePlayer(false)}><img src="/icons/close.svg" alt="" className="w-6 h-6 svg-white" /></button>
          <form className="w-full" onSubmit={(e) => handleMovePlayer(e, player._id)}>
            <SelectInput handleSelect={handleDivisionChange} vertical name='division' optionList={divisionList ? divisionList : []} />
            <SelectInput handleSelect={(e) => handleTeamChange(e, player._id)} vertical name='team' optionList={teamOptions} />
            <button className="btn-info mt-4" type='submit'>Move</button>
          </form>
        </div>
      )}
    </React.Fragment>
  )
}

export default PlayerCard;