import cld from '@/config/cloudinary.config';
import { DELETE_A_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { GET_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { IPlayer, IPlayerExpRel, EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { AdvancedImage, responsive } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { IOption, ITeam } from '@/types';
import EmailInput from '../elements/forms/EmailInput';
import { UserRole } from '@/types/user';
import { formatUSPhoneNumber } from '@/utils/datetime';

interface PlayerCardProps {
  player: IPlayerExpRel;
  eventId: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  teamId?: string | null;
  showRank?: boolean;
  rankControls?: boolean;
  isAssigned?: boolean;
  divisionList?: IOption[];
  teamList?: ITeam[];
  refetchFunc?: () => void;
}

function PlayerCard({ player, teamId, eventId, setIsLoading, showRank, rankControls, divisionList, teamList, refetchFunc }: PlayerCardProps) {

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);
  const [newTeamId, setNewTeamId] = useState<null | string>(null);

  const [newPlayerRole, setNewPlayerRole] = useState<UserRole | null>(null);
  const [newEmail, setNewEmail] = useState<string>('');
  const dialogEl = useRef<HTMLDialogElement | null>(null);

  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation(UPDATE_PLAYER);
  const [deleteAPlayer] = useMutation(DELETE_A_PLAYER);

  const playerLiEl = useRef<HTMLDivElement | null>(null);


  // ====== Actions for players  ====== 
  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }


  const makeCaptainOrCoCaptain = async (input: { captain?: string, cocaptain?: string }) => {
    setActionOpen(prevState => !prevState);
    try {
      setIsLoading(true);
      if (teamId && eventId) {
        await mutateTeam({ variables: { input, teamId, eventId } });
        await client.refetchQueries({ include: [GET_A_TEAM] });
      }
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
      const playerInputObj: { playerTeamId?: string, team: string | null } = { team: newTeamId };
      let prevTeamId = teamId;
      if (prevTeamId && player?.teams && player?.teams.length > 0) {
        const nti = player?.teams[0];
        const teamExist = teamList?.find((t) => t._id === nti._id);
        if (teamExist) {
          playerInputObj.playerTeamId = teamExist._id;
        }
      }
      await mutatePlayer({
        variables: {
          input: playerInputObj,
          playerId
        }
      });

      if (refetchFunc) await refetchFunc();
      setActionOpen(false);
      setMovePlayer(false);
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

      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    }

  }
  const handleDelete = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      setActionOpen(prevState => !prevState);
      setIsLoading(true);
      const deletePlayer = await deleteAPlayer({ variables: { playerId } });
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }


  const closeModal = () => {
    if (dialogEl && dialogEl.current) {
      dialogEl.current.close();
      setNewPlayerRole(null);
      setNewEmail('');
    }
  }

  const handleOpenDialog = (e: React.SyntheticEvent, capOrCo: UserRole) => {
    e.preventDefault();
    if (dialogEl && dialogEl.current) {
      setNewPlayerRole(capOrCo);
      setActionOpen(prevState => !prevState);
      dialogEl.current.showModal()
    }
  }

  const handleCloseModal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
  }

  const handleCaptainEmail = async (e: React.SyntheticEvent) => {
    /**
     * Add email for player
     * And Make him captain
     */
    e.preventDefault();
    if (!newEmail || newEmail === "") return;
    const updateObj: { email?: string, captain?: string, cocaptain?: string } = { email: newEmail };
    if (newPlayerRole === UserRole.captain) {
      updateObj.captain = player._id;
    } else if (newPlayerRole === UserRole.co_captain) {
      updateObj.cocaptain = player._id;
    }
    try {
      const updatePlayer = await mutatePlayer({
        variables: {
          input: { email: newEmail },
          playerId: player._id
        }
      });
      if (updateObj.email) {
        delete updateObj.email;
        const updateTeam = await makeCaptainOrCoCaptain(updateObj);
      }
      closeModal();
    } catch (error) {
      console.log(error);

    }
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



  const renderTeam = () => {
    let teamFound = null;
    if (player?.teams && player?.teams.length > 0) {
      const nti = player?.teams[0];
      teamFound = teamList?.find((t) => t._id === nti._id);
    }
    return <p className='text-yellow-logo uppercase'>{teamFound ? teamFound.name : "Unassigned"}</p>;
  }

  return (
    <React.Fragment>
      <div className={`w-full flex justify-between items-center ${!player?.teams || player?.teams.length === 0 ? "bg-gray-700 " : "bg-gray-500"} py-2 relative rounded-md `} style={{ minHeight: '6rem' }} >


        {/* Draggable element start  */}
        <div className="draggable-element w-11/12 flex justify-between items-center" draggable={rankControls ? true : false}  >
          <input type="checkbox" name="player-select" id="option" className='w-1/12' />

          <div ref={playerLiEl} className="mobile-draggable-element w-11/12 flex justify-between items-center gap-1">
            <div className="img-wrapper h-full w-9/12 flex justify-between items-center gap-1">

              <div className="advanced-img w-20 h-24 border border-yellow rounded-lg border-4">
                {player.profile ? <AdvancedImage className="w-full h-full " cldImg={cld.image(player.profile)} />
                  : <img src="/icons/sports-man.svg" alt="" className="svg-white w-full h-full" />}
              </div>

              <div className="player-name flex flex-col w-full">
                <h3 className='break-words w-28 md:w-full capitalize'>{player.firstName + ' ' + player.lastName}</h3>
                {player?.captainofteams && player?.captainofteams.length > 0 && <p className='text-yellow-logo uppercase'>Captain</p>}
                {player?.cocaptainofteams && player?.cocaptainofteams.length > 0 && <p className='text-yellow-logo uppercase'>Co-Captain</p>}
                {!teamId && renderTeam()}
              </div>
            </div>


            <div className="text-box w-3/12 flex flex-col justify-center items-center">
              {showRank && player?.rank && (
                <div className="rank-box flex flex-col items-center rounded-lg">
                  <h3 className='bg-yellow-logo text-gray-900 px-2 flex justify-center items-center text-base'>
                    {player?.rank}
                  </h3>
                  <p>Rank</p>
                </div>
              )}
              <div className="flex flex-col justify-center items-center w-full text-center">
                <p className='break-words' >{player.username}</p>
                <p className='break-words' >{player.phone ? formatUSPhoneNumber(player.phone) : 'Phone: N/A'}</p>
              </div>
            </div>
          </div>


        </div>
        {/* Draggable element End  */}

        {/* Operation menu start  */}
        <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 md:right-20 z-10 rounded-lg`}>
          <li role="presentation" > <Link href={`/${eventId}/players/${player._id}`}>Edit</Link></li>
          {rankControls && player.status === EPlayerStatus.ACTIVE && (<React.Fragment>
            <li role="presentation" onClick={(e) =>handleMakeCaptain(e, player._id) } > Make Captain</li>
            <li role="presentation" onClick={(e) =>handleMakeCoCaptain(e, player._id)} > Make Co-Captain</li>
          </React.Fragment>)}
          <li role="presentation" onClick={handleMovePlayerBox} > Move Player</li>
          {player.status === EPlayerStatus.ACTIVE ? (<li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.INACTIVE, player._id)} > Make Inactive</li>) : (<li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.ACTIVE, player._id)} > Make Active</li>)}
          <li role="presentation" onClick={(e) => handleDelete(e, player._id)} >Delete</li>
        </ul>
        <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 svg-white' role="presentation" onClick={handleOpenAction} />
        {/* Operation menu ende  */}

        {/* Add email operation start  */}
        <dialog ref={dialogEl} className='w-4/6 p-4'>
          <img src="/icons/close.svg" role='presentation' className="svg-white" onClick={handleCloseModal} />
          <form onSubmit={handleCaptainEmail}>
            {/* @ts-ignore */}
            <EmailInput name='email' required handleInputChange={e => setNewEmail(e.target.value)} vertical />
            <button className="btn-info mt-4" type='submit'>Make Captain</button>
          </form>
        </dialog>
        {/* Add email operation end  */}
      </div>
      {movePlayer && (
        <div className="w-full move-team w-full p-2 bg-gray-800 flex flex-col items-start justify-end relative">
          <button className="close" onClick={(e) => setMovePlayer(false)}><img src="/icons/close.svg" alt="" className="w-6 h-6 svg-white" /></button>
          <form className="w-full" onSubmit={(e) => handleMovePlayer(e, player._id)}>
            <SelectInput key={"division-1"} handleSelect={handleDivisionChange} vertical name='division' optionList={divisionList ? divisionList : []} />
            <SelectInput key={`division-2`} handleSelect={(e) => handleTeamChange(e, player._id)} vertical name='team' optionList={teamOptions} />
            <button className="btn-info mt-4" type='submit'>Move</button>
          </form>
        </div>
      )}
    </React.Fragment>
  )
}

export default PlayerCard;