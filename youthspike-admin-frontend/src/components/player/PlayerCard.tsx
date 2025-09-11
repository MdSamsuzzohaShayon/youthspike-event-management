import { DELETE_A_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { GET_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { IOption, IPlayerRank, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { formatUSPhoneNumber } from '@/utils/datetime';
import { useUser } from '@/lib/UserProvider';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import EmailInput from '../elements/forms/EmailInput';
import { handleError, handleResponse } from '@/utils/handleError';
import { useLdoId } from '@/lib/LdoProvider';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { useError } from '@/lib/ErrorProvider';
import PlayerMoveDialog from './PlayerMoveDialog';

interface PlayerCardProps {
  player: IPlayerRank;
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isChecked: boolean;
  handleSelectPlayer: (e: React.SyntheticEvent, _id: string) => void;
  teamId?: string | null;
  showRank?: boolean;
  rankControls?: boolean;
  divisionList?: IOption[];
  teamList?: ITeam[];
  refetchFunc?: () => void;
  rank?: number | null;
}

function PlayerCard({ player, teamId, eventId, setIsLoading, showRank, rankControls, divisionList, teamList, refetchFunc, isChecked, handleSelectPlayer }: PlayerCardProps) {
  const { setActErr } = useError();

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);

  const [newPlayerRole, setNewPlayerRole] = useState<UserRole | null>(null);
  const [newEmail, setNewEmail] = useState<string>('');
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const dialogMoveEl = useRef<HTMLDialogElement | null>(null);

  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation(UPDATE_PLAYER);
  const [deleteAPlayer] = useMutation(DELETE_A_PLAYER);

  const playerLiEl = useRef<HTMLDivElement | null>(null);

  const user = useUser();
  const { ldoIdUrl } = useLdoId();

  // ====== Actions for players  ======

  const makeCaptainOrCoCaptain = async (input: { captain?: string; cocaptain?: string }) => {
    setActionOpen((prevState) => !prevState);
    try {
      setIsLoading(true);
      if (teamId && eventId) {
        const response = await mutateTeam({ variables: { input, teamId, eventId } });
        const success = await handleResponse({ response: response.data.updateTeam, setActErr });
        if (!success) return;
        // Not recommended
        window.location.reload();
      }
    } catch (error: any) {
      handleError({ error, setActErr });
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
    dialogMoveEl.current?.showModal();
  };

  const handleChangeStatus = async (e: React.SyntheticEvent, newStatus: EPlayerStatus, playerId: string) => {
    e.preventDefault();

    setActionOpen((prevState) => !prevState);
    try {
      const response = await mutatePlayer({
        variables: {
          input: { status: newStatus, newTeamId: teamId },
          playerId,
        },
      });
      const success = await handleResponse({ response: response.data.updatePlayer, setActErr });
      if (!success) return;

      if (refetchFunc) {
        window.location.reload();
      }
    } catch (error: any) {
      handleError({ error, setActErr });
    }
  };
  const handleDelete = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      setActionOpen((prevState) => !prevState);
      setIsLoading(true);
      const response = await deleteAPlayer({ variables: { playerId } });
      const success = await handleResponse({ response: response.data.deletePlayer, setActErr });
      if (!success) return;
      if (refetchFunc) {
        await refetchFunc();
      } else {
        await client.refetchQueries({ include: [GET_A_TEAM] });
      }
    } catch (error: any) {
      handleError({ error, setActErr });
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
      handleError({ error, setActErr });
    }
  };

  return (
    <>
      <div className={`relative flex items-center gap-3 w-full`}>
        {/* Draggable element start  */}
        <div className="draggable-element w-11/12 flex justify-between items-center" draggable={!!rankControls}>
          <div ref={playerLiEl} className="mobile-draggable-element w-11/12 flex justify-between items-center gap-1">
            <div className="img-wrapper h-full w-9/12 flex justify-between items-center gap-1">
              <div className="advanced-img w-20 h-20 border border-yellow rounded-lg border-4">
                {player.profile ? (
                  <CldImage width={100} height={100} alt="player's profile picture" className="w-full h-full " src={player.profile} />
                ) : (
                  <Image width={imgSize.xs} height={imgSize.xs} src="/icons/sports-man.svg" alt="" className="svg-white w-full h-full" />
                )}
              </div>

              <div className="player-name flex flex-col w-full">
                <h3 className="break-words w-28 md:w-full capitalize">{`${player.firstName} ${player.lastName}`}</h3>
                <p className="">{player?.username}</p>
                {player?.captainofteams && player?.captainofteams.length > 0 && <p className="text-yellow-logo uppercase">Captain</p>}
                {player?.cocaptainofteams && player?.cocaptainofteams.length > 0 && <p className="text-yellow-logo uppercase">Co-Captain</p>}
                {!showRank && !teamId && user.info?.role !== UserRole.captain && user.info?.role !== UserRole.co_captain && (
                  <p className="text-yellow-logo uppercase">{(player?.teams || [])[0]?.name || 'Unassigned'}</p>
                )}
              </div>
            </div>

            <div className="text-box w-3/12 flex flex-col justify-center items-center">
              {showRank && player.rank && (
                <div className="rank-box flex flex-col items-center rounded-lg">
                  <h3 className="bg-yellow-logo text-black px-2 flex justify-center items-center text-base">{player.rank}</h3>
                  <p>Rank</p>
                </div>
              )}
              {player.phone && (
                <div className="flex flex-col justify-center items-center w-full text-center">
                  <p className="break-words">{formatUSPhoneNumber(player.phone)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Draggable element End  */}

        {/* Operation menu start  */}
        <AnimatePresence>
          {actionOpen && (
            <motion.ul
              className="absolute z-10 right-6 top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <Link href={`/${eventId}/players/${player._id}/${ldoIdUrl}`}>Edit</Link>
              </li>
              {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
                <React.Fragment>
                  {rankControls && player.status === EPlayerStatus.ACTIVE && (
                    <>
                      <li
                        role="presentation"
                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => (player.email && player.email.trim() !== '' ? handleMakeCaptain(e, player._id) : handleOpenDialog(e, UserRole.captain))}
                      >
                        Make Captain
                      </li>
                      <li
                        role="presentation"
                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => (player.email && player.email.trim() !== '' ? handleMakeCoCaptain(e, player._id) : handleOpenDialog(e, UserRole.co_captain))}
                      >
                        Make Co-Captain
                      </li>
                      <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={handleMovePlayerBox}>
                        Move Player
                      </li>
                    </>
                  )}
                  {/* <li role="presentation" className='px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' onClick={handleMovePlayerBox}>
                    Move Player
                  </li> */}
                  {player.status === EPlayerStatus.ACTIVE ? (
                    <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => handleChangeStatus(e, EPlayerStatus.INACTIVE, player._id)}>
                      Make Inactive
                    </li>
                  ) : (
                    <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => handleChangeStatus(e, EPlayerStatus.ACTIVE, player._id)}>
                      Make Active
                    </li>
                  )}
                  <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => handleDelete(e, player._id)}>
                    Delete
                  </li>
                </React.Fragment>
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        <div className="dot-img-wrapper w-1/12 flex justify-end items-end">
          <button
            onClick={() => setActionOpen((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Options"
          >
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dots-vertical.svg" alt="options" className="w-5 h-5 svg-white" />
          </button>
        </div>
        {/* Operation menu ende  */}

        {/* Add email operation start  */}
        <dialog ref={dialogEl} className="modal-dialog">
          <div className="p-4">
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" role="presentation" className="svg-white" onClick={handleCloseModal} alt="close-icon" />
            <form onSubmit={handleCaptainEmail}>
              {/* @ts-ignore */}
              <EmailInput key="eml-pc-1" name="email" required handleInputChange={(e) => setNewEmail(e.target.value)} />
              <button className="btn-info mt-4" type="submit">
                Make Captain
              </button>
            </form>
          </div>
        </dialog>
        {/* Add email operation end  */}

        <PlayerMoveDialog
          dialogMoveEl={dialogMoveEl}
          divisionList={divisionList || []}
          mutatePlayer={mutatePlayer}
          player={player}
          refetchFunc={refetchFunc}
          setActErr={setActErr}
          setActionOpen={setActionOpen}
          setMovePlayer={setMovePlayer}
          teamId={teamId || null}
          teamList={teamList || []}
        />

        {/* Move player operation end  */}
      </div>
    </>
  );
}

export default PlayerCard;
