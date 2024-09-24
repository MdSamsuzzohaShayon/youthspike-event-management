import cld from '@/config/cloudinary.config';
import { DELETE_A_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { GET_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { IPlayerExpRel, EPlayerStatus } from '@/types/player';
import { ApolloError, useMutation } from '@apollo/client';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { IError, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { formatUSPhoneNumber } from '@/utils/datetime';
import { useUser } from '@/lib/UserProvider';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import EmailInput from '../elements/forms/EmailInput';
import SelectInput from '../elements/forms/SelectInput';
import { handleError, handleResponse } from '@/utils/handleError';

interface PlayerCardProps {
  player: IPlayerExpRel;
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  teamId?: string | null;
  showRank?: boolean;
  rankControls?: boolean;
  divisionList?: IOption[];
  teamList?: ITeam[];
  refetchFunc?: () => void;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
  rank?: number | null;
}

function PlayerCard({ player, teamId, eventId, setIsLoading, showRank, rankControls, divisionList, teamList, refetchFunc, setActErr, rank }: PlayerCardProps) {
  
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);
  const [newTeamId, setNewTeamId] = useState<null | string>(null);

  const [newPlayerRole, setNewPlayerRole] = useState<UserRole | null>(null);
  const [newEmail, setNewEmail] = useState<string>('');
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const [ldoId, setLdoId] = useState<string>('');

  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation(UPDATE_PLAYER);
  const [deleteAPlayer] = useMutation(DELETE_A_PLAYER);

  const playerLiEl = useRef<HTMLDivElement | null>(null);

  const user = useUser();

  // ====== Actions for players  ======
  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen((prevState) => !prevState);
  };

  const makeCaptainOrCoCaptain = async (input: { captain?: string; cocaptain?: string }) => {
    setActionOpen((prevState) => !prevState);
    try {
      setIsLoading(true);
      if (teamId && eventId) {
        const response = await mutateTeam({ variables: { input, teamId, eventId } });
        const success = handleResponse({response: response.data.updateTeam, setActErr});
        if(!success) return;
        await client.refetchQueries({ include: [GET_A_TEAM] });
      }
    } catch (error: any) {
      handleError({error, setActErr});
    } finally {
      setIsLoading(false);
    }
  };
  const handleMakeCaptain = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    makeCaptainOrCoCaptain({ captain: playerId });
  };
  const handleMakeCoCaptain = (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    makeCaptainOrCoCaptain({ cocaptain: playerId });
  };
  const handleMovePlayerBox = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMovePlayer(true);
    setActionOpen((prevState) => !prevState);
  };
  const handleMovePlayer = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      const playerInputObj: { playerTeamId?: string; team: string | null } = { team: newTeamId };
      const prevTeamId = teamId;
      if (prevTeamId && player?.teams && player?.teams.length > 0) {
        const nti = player?.teams[0];
        const teamExist = teamList?.find((t) => t._id === nti._id);
        if (teamExist) {
          playerInputObj.playerTeamId = teamExist._id;
        }
      }
      const response = await mutatePlayer({
        variables: {
          input: playerInputObj,
          playerId,
        },
      });

      const success = handleResponse({response: response.data.updatePlayer, setActErr});
      if(!success) return;

      if (refetchFunc) await refetchFunc();
      setActionOpen(false);
      setMovePlayer(false);
    } catch (error: any) {
      handleError({error, setActErr});
    }
  };
  const handleChangeStatus = async (e: React.SyntheticEvent, newStatus: EPlayerStatus, playerId: string) => {
    e.preventDefault();

    setActionOpen((prevState) => !prevState);
    try {
      const response  = await mutatePlayer({
        variables: {
          input: { status: newStatus, playerTeamId: teamId },
          playerId,
        },
      });
      const success = handleResponse({response: response.data.updatePlayer, setActErr});
      if(!success) return;

      if (refetchFunc) await refetchFunc();
    } catch (error: any) {
      handleError({error, setActErr});
    }
  };
  const handleDelete = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      setActionOpen((prevState) => !prevState);
      setIsLoading(true);
      const response = await deleteAPlayer({ variables: { playerId } });
      const success = handleResponse({response: response.data.deletePlayer, setActErr});
      if(!success) return;
      if (refetchFunc) {
        await refetchFunc();
      } else {
        await client.refetchQueries({ include: [GET_A_TEAM] });
      }
    } catch (error: any) {
      handleError({error, setActErr});
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    if (dialogEl && dialogEl.current) {
      dialogEl.current.close();
      setNewPlayerRole(null);
      setNewEmail('');
    }
  };

  const handleOpenDialog = (e: React.SyntheticEvent, capOrCo: UserRole) => {
    e.preventDefault();
    if (dialogEl && dialogEl.current) {
      setNewPlayerRole(capOrCo);
      setActionOpen((prevState) => !prevState);
      dialogEl.current.showModal();
    }
  };

  const handleCloseModal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
  };

  const handleCaptainEmail = async (e: React.SyntheticEvent) => {
    /**
     * Add email for player
     * And Make him captain
     */
    e.preventDefault();
    if (!newEmail || newEmail === '') return;
    const updateObj: { email?: string; captain?: string; cocaptain?: string } = { email: newEmail };
    if (newPlayerRole === UserRole.captain) {
      updateObj.captain = player._id;
    } else if (newPlayerRole === UserRole.co_captain) {
      updateObj.cocaptain = player._id;
    }
    try {
      await mutatePlayer({
        variables: {
          input: { email: newEmail },
          playerId: player._id,
        },
      });
      if (updateObj.email) {
        delete updateObj.email;
        await makeCaptainOrCoCaptain(updateObj);
      }
      closeModal();
    } catch (error: any) {
      handleError({error, setActErr});
    }
  };

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
  };

  // eslint-disable-next-line no-unused-vars
  const handleTeamChange = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setNewTeamId(inputEl.value);
  };

  const makePlayerEditUrl = (eId: string, pId: string) => {
    // `/${eventId}/players/${player._id}`
    let newUrl = `/${eId}/players/${pId}`;
    if (user && user.info && user.info.role === UserRole.admin && ldoId !== '') newUrl += `/?ldoId=${ldoId}`;
    return newUrl;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ldoIdParam = searchParams.get('ldoId');

    if (ldoIdParam) {
      setLdoId(ldoIdParam);
    }
  }, [window.location.search]);

  const renderTeam = () => {
    let teamFound = null;
    if (player?.teams && player?.teams.length > 0) {
      const nti = player?.teams[0];
      teamFound = teamList?.find((t) => t._id === nti._id);
    }
    return <p className="text-yellow-logo uppercase">{teamFound ? teamFound.name : 'Unassigned'}</p>;
  };

  return (
    <>
      <div
        className={`w-full flex justify-between items-center ${!player?.teams || player?.teams.length === 0 ? 'bg-gray-700 ' : 'bg-gray-500'} py-2 relative rounded-md `}
        style={{ minHeight: '6rem' }}
      >
        {/* Draggable element start  */}
        <div className="draggable-element w-11/12 flex justify-between items-center" draggable={!!rankControls}>
          <input type="checkbox" name="player-select" id="option" className="w-1/12" />

          <div ref={playerLiEl} className="mobile-draggable-element w-11/12 flex justify-between items-center gap-1">
            <div className="img-wrapper h-full w-9/12 flex justify-between items-center gap-1">
              <div className="advanced-img w-20 h-20 border border-yellow rounded-lg border-4">
                {player.profile ? (
                  <AdvancedImage className="w-full h-full " cldImg={cld.image(player.profile)} />
                ) : (
                  <Image width={imgSize.xs} height={imgSize.xs} src="/icons/sports-man.svg" alt="" className="svg-white w-full h-full" />
                )}
              </div>

              <div className="player-name flex flex-col w-full">
                <h3 className="break-words w-28 md:w-full capitalize">{`${player.firstName} ${player.lastName}`}</h3>
                {player?.captainofteams && player?.captainofteams.length > 0 && <p className="text-yellow-logo uppercase">Captain</p>}
                {player?.cocaptainofteams && player?.cocaptainofteams.length > 0 && <p className="text-yellow-logo uppercase">Co-Captain</p>}
                {!teamId && user.info?.role !== UserRole.captain && user.info?.role !== UserRole.co_captain && renderTeam()}
              </div>
            </div>

            <div className="text-box w-3/12 flex flex-col justify-center items-center">
              {showRank && rank && (
                <div className="rank-box flex flex-col items-center rounded-lg">
                  <h3 className="bg-yellow-logo text-gray-900 px-2 flex justify-center items-center text-base">{rank}</h3>
                  <p>Rank</p>
                </div>
              )}
              <div className="flex flex-col justify-center items-center w-full text-center">
                <p className="break-words">{player.phone ? formatUSPhoneNumber(player.phone) : 'Phone: N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Draggable element End  */}

        {/* Operation menu start  */}
        <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 md:right-20 z-10 rounded-lg`}>
          <li role="presentation">
            {' '}
            <Link href={makePlayerEditUrl(eventId, player._id)}>Edit</Link>
          </li>
          {rankControls && player.status === EPlayerStatus.ACTIVE && (
            <>
              <li role="presentation" onClick={(e) => (player.email && player.email.trim() !== '' ? handleMakeCaptain(e, player._id) : handleOpenDialog(e, UserRole.captain))}>
                {' '}
                Make Captain
              </li>
              <li role="presentation" onClick={(e) => (player.email && player.email.trim() !== '' ? handleMakeCoCaptain(e, player._id) : handleOpenDialog(e, UserRole.co_captain))}>
                {' '}
                Make Co-Captain
              </li>
            </>
          )}
          <li role="presentation" onClick={handleMovePlayerBox}>
            {' '}
            Move Player
          </li>
          {player.status === EPlayerStatus.ACTIVE ? (
            <li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.INACTIVE, player._id)}>
              {' '}
              Make Inactive
            </li>
          ) : (
            <li role="presentation" onClick={(e) => handleChangeStatus(e, EPlayerStatus.ACTIVE, player._id)}>
              {' '}
              Make Active
            </li>
          )}
          <li role="presentation" onClick={(e) => handleDelete(e, player._id)}>
            Delete
          </li>
        </ul>
        <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dots-vertical.svg" alt="dot-vertical" className="w-1/12 svg-white" role="presentation" onClick={handleOpenAction} />
        {/* Operation menu ende  */}

        {/* Add email operation start  */}
        <dialog ref={dialogEl} className="w-4/6 p-4">
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" role="presentation" className="svg-white" onClick={handleCloseModal} alt="close-icon" />
          <form onSubmit={handleCaptainEmail}>
            {/* @ts-ignore */}
            <EmailInput key="eml-pc-1" name="email" required handleInputChange={(e) => setNewEmail(e.target.value)} vertical />
            <button className="btn-info mt-4" type="submit">
              Make Captain
            </button>
          </form>
        </dialog>
        {/* Add email operation end  */}
      </div>
      {movePlayer && (
        <div className="w-full move-team w-full p-2 bg-gray-800 flex flex-col items-start justify-end relative">
          <button type="button" className="close" aria-label="close" onClick={() => setMovePlayer(false)}>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" alt="" className="w-6 h-6 svg-white" />
          </button>
          <form className="w-full" onSubmit={(e) => handleMovePlayer(e, player._id)}>
            <SelectInput key="division-1" handleSelect={handleDivisionChange} vertical name="division" optionList={divisionList || []} />
            <SelectInput key="division-2" handleSelect={(e) => handleTeamChange(e, player._id)} vertical name="team" optionList={teamOptions} />
            <button className="btn-info mt-4" type="submit">
              Move
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default PlayerCard;
