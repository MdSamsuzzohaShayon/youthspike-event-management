import { EPlayerStatus } from '@/types/player';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { IBadge, IEvent, IOption, IPlayerRank, ITeam, TUpdatePlayer, TUpdateTeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { useLdoId } from '@/lib/LdoProvider';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { useMessage } from '@/lib/MessageProvider';
import PlayerMoveDialog from './PlayerMoveDialog';
import TextImg from '../elements/TextImg';
import AddEmailDialog from './AddEmailDialog';
import { FRONTEND_URL } from '@/utils/keys';
import DeletePlayerDialog from './DeletePlayerDialog';
import { useApolloClient } from '@apollo/client/react';
import routerService from '@/lib/router-service';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';
import BadgeInput from '../elements/forms/BadgeInput';
import BadgeSelect from '../elements/forms/BadgeSelect';
import PlayerUsernameRole from './PlayerUsernameRole';
import PlayerOperation from './PlayerOperation';
import LogoWithBadge from '../badge/LogoWithBadge';
import PlayerInfo from './PlayerInfo';


interface IPlayerCardProps {
  player: IPlayerRank;
  isChecked: boolean;
  onSelect: (e: React.SyntheticEvent, _id: string) => void;
  teams: ITeam[]; // all team of player
  teamList: ITeam[]; // all team list
  selectedTeam?: ITeam | null; // if we are inside a team
  selectedEvent?: IEvent | null; // if we are inside a team
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showRank?: boolean;
  rankControls?: boolean;
  divisionList?: IOption[];
  rank?: number | null;
  badge: IBadge | null | undefined; // Selected badge
  badges: IBadge[];

  // New 
  onUpdateTeam: (e: React.SyntheticEvent, update: Partial<TUpdateTeam>, teamId: string) => void;
  onUpdatePlayer: (e: React.SyntheticEvent, update: Partial<TUpdatePlayer>, playerId: string) => void;
  onDelete: (e: React.SyntheticEvent, playerId: string) => void;
}



export default function PlayerCard({ player, isChecked, onSelect, teams, teamList, badge, badges, setIsLoading, showRank, rank, divisionList, rankControls, selectedTeam, selectedEvent,
  onUpdateTeam, onUpdatePlayer, onDelete }: IPlayerCardProps) {





  // State
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [movePlayer, setMovePlayer] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPlayerRole, setNewPlayerRole] = useState<UserRole | null>(null);

  // Reference
  const deleteRef = useRef<HTMLDialogElement | null>(null);
  const makeCaptainWithEmailRef = useRef<HTMLDialogElement | null>(null);
  const dialogMoveRef = useRef<HTMLDialogElement | null>(null);


  // Hooks
  const { setMessage } = useMessage();
  const user = useUser();





  // Memoized values
  const name = useMemo(() => `${player.firstName} ${player.lastName}`, [player.firstName, player.lastName]);



  const captainofteams = useMemo(() => player.captainofteams?.map((t) => (typeof t === 'object' ? t?._id : t)) || [], [player]);
  const cocaptainofteams = useMemo(() => player.cocaptainofteams?.map((t) => (typeof t === 'object' ? t?._id : t)) || [], [player]);



  const teamSet = useMemo(() => new Set(teams.map((team) => typeof team === 'object' ? team._id : team)), [teams]);

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





  const closeModal = useCallback(() => {
    if (makeCaptainWithEmailRef.current) {
      makeCaptainWithEmailRef.current.close();
      setNewPlayerRole(null);
      setNewEmail('');
    }
  }, []);

  const handleBadgeChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    onUpdatePlayer(e, { badge: inputEl.value }, player._id);
  }



  const handleCaptainEmail =
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
        await onUpdatePlayer(e, { email: newEmail }, player._id)
        if (updateObj.email) {
          delete updateObj.email;
          if (selectedTeam?._id) {
            await onUpdateTeam(e, updateObj, selectedTeam?._id as string)
          }
        }
        closeModal();
      } catch (error: unknown) {
        console.error(error);
      }
    }

  const handleEmailClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (makeCaptainWithEmailRef.current) {
      setNewPlayerRole(null);
      makeCaptainWithEmailRef.current.close();
    }
  }




  return (
    <React.Fragment>
      {/* ✅ Desktop Layout */}
      <div className="hidden md:flex w-full items-center justify-between transition">
        {/* First section  */}
        <div className="w-3/6 flex justify-start gap-x-2 items-center">
          <div className="logo-with-badge">
            <LogoWithBadge name={name} logo={player?.profile} badge={badge} size="w-22 h-22" badgeSize="w-8 h-8" />
          </div>
          <div className="player-info">
            <PlayerInfo name={name} selectedEvent={selectedEvent} teams={teams} />
          </div>
        </div>

        {/* Last section  */}
        <div className="w-3/6 flex justify-end gap-x-2 items-center">
          <div className="flex items-center gap-4 w-full">
            {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && badges.length > 0 && (
              <BadgeSelect
                name="badge"
                className='w-48'
                value={badge?._id}
                badges={badges || []}
                onChange={handleBadgeChange}
              />
            )}
          </div>

          <div className="player-role mr-4">
            <PlayerUsernameRole player={player} isCaptain={isCaptain} isCoCaptain={isCoCaptain} />
          </div>

          {rank && (
            <button
              className="mr-4 flex w-10 h-10 items-center justify-center bg-yellow-logo text-black dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Options"
            >
              <p className="uppercase font-bold tracking-wide">{rank}</p>
            </button>
          )}

          <div className="player-operation-buttons">
            <PlayerOperation
              player={player} actionOpen={actionOpen} rankControls={rankControls} selectedTeam={selectedTeam} dialogMoveRef={dialogMoveRef} makeCaptainWithEmailRef={makeCaptainWithEmailRef} deleteRef={deleteRef}
              onDelete={onDelete} onUpdatePlayer={onUpdatePlayer} onUpdateTeam={onUpdateTeam}
              setActionOpen={setActionOpen} setIsOptionsOpen={setIsOptionsOpen} setMovePlayer={setMovePlayer} setNewPlayerRole={setNewPlayerRole}
            />
          </div></div>


      </div>

      {/* ✅ Mobile Layout */}
      <div className="w-full flex items-center gap-y-1 md:hidden">
        {/* First section  */}
        <div className="w-4/12 flex flex-col items-center justify-start">
          <LogoWithBadge name={name} logo={player?.profile} badge={badge} size="w-full" badgeSize="w-8 h-8" />
        </div>
        {/* Second section  */}
        <div className="w-6/12">
          <div className="w-full px-1 flex flex-col items-center justify-start">
            <div className="player-info">
              <PlayerInfo name={name} selectedEvent={selectedEvent} teams={teams} />
            </div>
            {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
              <BadgeSelect
                name="badge"
                className='w-full my-2'
                value={badge?._id}
                badges={badges || []}
                onChange={handleBadgeChange}
              />
            )}
            <div className="player-role mr-4">
              <PlayerUsernameRole player={player} isCaptain={isCaptain} isCoCaptain={isCoCaptain} />
            </div>
          </div>
        </div>
        {/* Third section  */}
        <div className="w-2/12 flex flex-col items-center justify-start gap-y-2">

          <div className="player-operation-buttons">
            <PlayerOperation
              player={player} actionOpen={actionOpen} rankControls={rankControls} selectedTeam={selectedTeam} dialogMoveRef={dialogMoveRef} makeCaptainWithEmailRef={makeCaptainWithEmailRef} deleteRef={deleteRef}
              onDelete={onDelete} onUpdatePlayer={onUpdatePlayer} onUpdateTeam={onUpdateTeam}
              setActionOpen={setActionOpen} setIsOptionsOpen={setIsOptionsOpen} setMovePlayer={setMovePlayer} setNewPlayerRole={setNewPlayerRole}
            />
          </div>
          <div className="player-rank">
            {rank && (
              <button
                className="md:hidden flex w-10 h-10 items-center justify-center bg-yellow-logo dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Options"
              >
                <p className="text-black uppercase font-bold tracking-wide">{rank}</p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add email operation start  */}
      <AddEmailDialog player={player} makeCaptainWithEmailRef={makeCaptainWithEmailRef} onCaptainEmail={handleCaptainEmail} onClose={handleEmailClose} setNewEmail={setNewEmail} />

      {/* Add email operation end  */}

      {/* ✅ Options Modal */}
      <PlayerMoveDialog
        dialogMoveRef={dialogMoveRef}
        divisionList={divisionList || []}
        onUpdatePlayer={onUpdatePlayer}
        player={player}
        setMessage={setMessage}
        setActionOpen={setActionOpen}
        setMovePlayer={setMovePlayer}
        teamId={selectedTeam?._id || null}
        teamList={teamList || []}
      />

      {/* Actions items end */}
      <DeletePlayerDialog deleteRef={deleteRef} onDelete={onDelete} player={player} />
    </React.Fragment>
  );
}
