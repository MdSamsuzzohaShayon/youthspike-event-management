import { DELETE_A_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { UPDATE_TEAM } from '@/graphql/teams';
import { EPlayerStatus } from '@/types/player';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { IGetTeamResponse, IOption, IPlayerRank, IResponse, ITeam, IUpdatePlayerResponse, TAddTeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError } from '@/utils/handleError';
import { useLdoId } from '@/lib/LdoProvider';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { useMessage } from '@/lib/MessageProvider';
import PlayerMoveDialog from './PlayerMoveDialog';
import TextImg from '../elements/TextImg';
import AddEmailDialog from './AddEmailDialog';
import { FRONTEND_URL } from '@/utils/keys';
import DeletePlayerDialog from './DeletePlayerDialog';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/request-handlers/playerHelpers';
import updateTeam from '@/utils/request-handlers/updateTeam';
import routerService from '@/lib/router-service';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';

interface IPlayerCardProps {
  player: IPlayerRank;
  isChecked: boolean;
  onSelect: (e: React.SyntheticEvent, _id: string) => void;
  teams: ITeam[]; // all team of player
  teamList: ITeam[]; // all team list
  selectedTeam?: ITeam | null; // if we are inside a team
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showRank?: boolean;
  rankControls?: boolean;
  divisionList?: IOption[];
  rank?: number | null;
}

export default function PlayerCard({ player, isChecked, onSelect, teams, teamList, setIsLoading, showRank, rank, divisionList, rankControls, selectedTeam }: IPlayerCardProps) {
  
  



  // State
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPlayerRole, setNewPlayerRole] = useState<UserRole | null>(null);
  const deleteEl = useRef<HTMLDialogElement | null>(null);

  // Reference
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const dialogMoveEl = useRef<HTMLDialogElement | null>(null);
  const uploadedLogoRef = useRef<Blob | null | MediaSource>(null);


  // Hooks
  const { setMessage } = useMessage();
  const user = useUser();
  const { ldoIdUrl } = useLdoId();
  const apolloClient = useApolloClient();

  // Mutations
  const [mutateTeam] = useMutation<{ updateTeam: IGetTeamResponse }>(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation<{ updatePlayer: IUpdatePlayerResponse }>(UPDATE_PLAYER);
  const [deleteAPlayer] = useMutation<{ deletePlayer: IResponse }>(DELETE_A_PLAYER);

  // Memoized values
  const name = useMemo(() => `${player.firstName} ${player.lastName}`, [player.firstName, player.lastName]);

  
  const teamsOfPlayer = useMemo(() => {
    const list = [];
    const set = new Set();
    for (const team of teams) {
      if (!set.has(team._id)) {
        list.push(team);
        set.add(team._id);
      }
    }
    return list;
  }, [teams]);
  const captainofteams = useMemo(() => player.captainofteams?.map((t) => (typeof t === 'object' ? t?._id : t)) || [], [player]);
  const cocaptainofteams = useMemo(() => player.cocaptainofteams?.map((t) => (typeof t === 'object' ? t?._id : t)) || [], [player]);

  const teamSet = useMemo(() => new Set(teams.map((team) => team._id)), [teams]);
  const isCaptain = useMemo(() => {

    let captain = false;
    if (teamSet.size > 0) {
      for (const captainOfTeam of captainofteams) {
        if (teamSet.has(captainOfTeam)) {
          captain = true;
        }
      }
    }
    return captain;
  }, [teamSet, captainofteams]);
  const isCoCaptain = useMemo(() => {

    let cocaptain = false;
    if (teamSet.size > 0) {
      for (const cocaptainOfTeam of cocaptainofteams) {
        if (teamSet.has(cocaptainOfTeam)) {
          cocaptain = true;
        }
      }
    }
    return cocaptain;
  }, [teamSet, cocaptainofteams]);







  // Optimized callbacks
  const makeCaptainOrCoCaptain = async (input: { captain?: string; cocaptain?: string }) => {
    setActionOpen((prev) => !prev);

    if(!selectedTeam){
      console.error("No selected team found");
      
      return;
    }


    await updateTeam({
      prevTeam: selectedTeam,
      updateTeamState: input as Partial<TAddTeam>,
      setMessage,
      setIsLoading,
      uploadedLogo: uploadedLogoRef,
      apolloClient,
      mutateTeam,
      events: selectedTeam?.events.map((e) => e._id) ?? [],
    });
    window.location.reload(); // temp

  };



  const handleMakeCaptain = useCallback(
    (e: React.SyntheticEvent, playerId: string) => {
      e.preventDefault();
      makeCaptainOrCoCaptain({ captain: playerId });
    },
    [makeCaptainOrCoCaptain],
  );

  const handleMakeCoCaptain = useCallback(
    (e: React.SyntheticEvent, playerId: string) => {
      e.preventDefault();
      makeCaptainOrCoCaptain({ cocaptain: playerId });
    },
    [makeCaptainOrCoCaptain],
  );

  const handleMovePlayerBox = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setMovePlayer(true);
    setActionOpen((prev) => !prev);
    dialogMoveEl.current?.showModal();
  }, []);

  const handleChangeStatus = useCallback(
    async (e: React.SyntheticEvent, newStatus: EPlayerStatus, playerId: string) => {
      e.preventDefault();
      setActionOpen((prev) => !prev);
      try {
        const response = await mutatePlayer({
          variables: {
            input: { status: newStatus, newTeamId: teamsOfPlayer[0] }, // temp
            playerId,
          },
        });
        const success = await handleResponseCheck(response.data?.updatePlayer, setMessage);
        if (!success) return;

        // Add cache
      } catch (error: any) {
        handleError({ error, setMessage });
      }
    },
    [teamsOfPlayer, mutatePlayer, setMessage],
  );

  const handleDelete = useCallback(
    async (e: React.SyntheticEvent, playerId: string) => {
      e.preventDefault();
      try {
        setActionOpen((prev) => !prev);
        if (setIsLoading) setIsLoading(true);
        const response = await deleteAPlayer({ variables: { playerId } });
        const success = await handleResponseCheck(response.data?.deletePlayer, setMessage);
        if (!success) return;
        // Add cache
      } catch (error: any) {
        handleError({ error, setMessage });
      } finally {
        if (setIsLoading) setIsLoading(false);
      }
    },
    [deleteAPlayer, setMessage, client, setIsLoading],
  );

  const closeModal = useCallback(() => {
    if (dialogEl.current) {
      dialogEl.current.close();
      setNewPlayerRole(null);
      setNewEmail('');
    }
  }, []);

  const handleOpenDialog = useCallback((e: React.SyntheticEvent, capOrCo: UserRole) => {
    e.preventDefault();
    if (dialogEl.current) {
      setNewPlayerRole(capOrCo);
      setActionOpen((prev) => !prev);
      dialogEl.current.showModal();
    }
  }, []);


  const handleEditRedirect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Set first event
    // if (player.events) SessionStorageService.setItem(CURRENT_EVENT, player.events[0])
    routerService.push(`/players/${player._id}/${ldoIdUrl}`);

  }

  const handleCaptainEmail = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!newEmail.trim()) return;

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
        handleError({ error, setMessage });
      }
    },
    [newEmail, newPlayerRole, player._id, mutatePlayer, makeCaptainOrCoCaptain, closeModal, setMessage],
  );

  // Memoized components
  const PlayerRole = useMemo(
    () => (
      <div className="username flex flex-col justify-between items-center">
        <p className="text-gray-400 text-sm">{player.username}</p>
        {player?.email && <p className="text-gray-400 text-sm word-breaks">{player.email}</p>}
        {isCaptain && <p className="text-yellow-logo uppercase">Captain</p>}
        {isCoCaptain && <p className="text-yellow-logo uppercase">Co-Captain</p>}
      </div>
    ),
    [player.username, isCaptain, isCoCaptain],
  );


  const PlayerInfo = useMemo(
    () => (
      <div className="player-name flex flex-col w-full text-white">
        <div className="w-full md:flex-col flex flex-wrap justify-between items-center md:items-start">
          <h5 className="break-words text-xs md:text-lg font-semibold capitalize">{name}</h5>
          {teamsOfPlayer && teamsOfPlayer.length > 0 && (
            teamsOfPlayer.map((team) => (<Link key={team._id} href={`/teams/${team._id}/roster/${ldoIdUrl}`} className="md:hidden text-yellow-400 uppercase font-bold tracking-wide underline">
              {team.name.slice(0, 3)}
            </Link>))
          )}
          {rank && (
            <button
              className="md:hidden flex w-8 h-8 items-center justify-center bg-yellow-logo dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Options"
            >
              <p className="text-black uppercase font-bold tracking-wide">{rank}</p>
            </button>
          )}
        </div>
        {teamsOfPlayer && teamsOfPlayer.length > 0 && (
          <div className="w-full hidden md:flex justify-start gap-x-2 items-center">
            {teamsOfPlayer.map((team) => (
              <Link key={team._id} href={`/teams/${team._id}/roster/${ldoIdUrl}`} className="text-yellow-400 uppercase font-bold tracking-wide">
                {team.name} {teamsOfPlayer.length > 1 && "/"}
              </Link>
            ))}
            {rank && (
              <button
                className="md:hidden flex w-10 h-10 items-center justify-center bg-yellow-logo dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Options"
              >
                <p className="text-black uppercase font-bold tracking-wide">{rank}</p>
              </button>
            )}
          </div>
        )}
      </div>
    ),
    [name, player.email, teamsOfPlayer, rank],
  );

  const PlayerImage = useMemo(
    () => (
      <div className="advanced-img w-8 md:w-16 h-8 md:h-16 overflow-hidden flex items-center justify-center">
        {player.profile ? (
          <CldImage crop="fit" width={100} height={100} alt={name} src={player.profile} className="w-full h-full object-cover object-fit" />
        ) : (
          <TextImg fullText={name} className="w-full h-full rounded-full object-cover object-fit" />
        )}
      </div>
    ),
    [player.profile, name],
  );

  const OptionsButton = useMemo(
    () => (
      <div
        className="w-8 md:w-10 h-8 md:h-10 relative flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Options"
        role="presentation"
        onClick={() => setIsOptionsOpen(true)}
      >
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
                <Link href={`${FRONTEND_URL}/players/${player._id}`}>Stats</Link>
              </li>
              {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
                <>
                  <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <button onClick={handleEditRedirect}>Edit</button>
                  </li>
                  {rankControls && player.status === EPlayerStatus.ACTIVE && (
                    <>
                      <li
                        role="presentation"
                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => (player.email?.trim() ? handleMakeCaptain(e, player._id) : handleOpenDialog(e, UserRole.captain))}
                      >
                        Make Captain
                      </li>
                      <li
                        role="presentation"
                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => (player.email?.trim() ? handleMakeCoCaptain(e, player._id) : handleOpenDialog(e, UserRole.co_captain))}
                      >
                        Make Co-Captain
                      </li>
                    </>
                  )}
                  <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={handleMovePlayerBox}>
                    Move Player
                  </li>
                  {player.status === EPlayerStatus.ACTIVE ? (
                    <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => handleChangeStatus(e, EPlayerStatus.INACTIVE, player._id)}>
                      Make Inactive
                    </li>
                  ) : (
                    <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => handleChangeStatus(e, EPlayerStatus.ACTIVE, player._id)}>
                      Make Active
                    </li>
                  )}
                  <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => deleteEl.current?.showModal()}>
                    Delete
                  </li>
                </>
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        <button onClick={() => setActionOpen((prev) => !prev)} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" aria-label="Options">
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dots-vertical.svg" alt="options" className="w-5 h-5 svg-white" />
        </button>
      </div>
    ),
    [
      actionOpen,
      player._id,
      player.email,
      player.status,
      ldoIdUrl,
      user.info?.role,
      rankControls,
      handleMakeCaptain,
      handleMakeCoCaptain,
      handleMovePlayerBox,
      handleChangeStatus,
      handleDelete,
      handleOpenDialog,
    ],
  );

  return (
    <>
      {/* ✅ Desktop Layout */}
      <div className="hidden md:flex w-full items-center justify-between transition">
        <div className="flex items-center gap-4 w-full">
          {PlayerImage}
          {PlayerInfo}
        </div>

        <div className="player-role mr-4">{PlayerRole}</div>

        {rank && (
          <button
            className="mr-4 flex w-10 h-10 items-center justify-center bg-yellow-logo text-black dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Options"
          >
            <p className="uppercase font-bold tracking-wide">{rank}</p>
          </button>
        )}

        {OptionsButton}
      </div>

      {/* ✅ Mobile Layout */}
      <div className="w-full flex flex-col items-center gap-y-1 md:hidden">
        <div className="w-full flex justify-between items-center">
          {PlayerImage}
          <div>{PlayerRole}</div>
          {OptionsButton}
        </div>
        {PlayerInfo}
      </div>

      {/* Add email operation start  */}
      <AddEmailDialog dialogEl={dialogEl} handleCaptainEmail={handleCaptainEmail} handleCloseModal={handleCaptainEmail} setNewEmail={setNewEmail} />

      {/* Add email operation end  */}

      {/* ✅ Options Modal */}
      <PlayerMoveDialog
        dialogMoveEl={dialogMoveEl}
        divisionList={divisionList || []}
        mutatePlayer={mutatePlayer}
        player={player}
        setMessage={setMessage}
        setActionOpen={setActionOpen}
        setMovePlayer={setMovePlayer}
        teamId={selectedTeam?._id || null}
        teamList={teamList || []}
      />

      {/* Actions items end */}
      <DeletePlayerDialog deleteEl={deleteEl} handleDelete={handleDelete} player={player} />
    </>
  );
}
