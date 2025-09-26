import { useUser } from '@/lib/UserProvider';
import { IMatchExpRel } from '@/types/match';
import { UserRole } from '@/types/user';
import { FRONTEND_URL } from '@/utils/keys';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { readDate } from '@/utils/datetime';
import useClickOutside from '../../hooks/useClickOutside';
import { useMutation } from '@apollo/client';
import { DELETE_MATCH } from '@/graphql/matches';
import { EActionProcess, IError, INetRelatives, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/helper';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { handleError } from '@/utils/handleError';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface MatchCardProps {
  match: IMatchExpRel;
  sl: number;
  eventId: string;
  isChecked: boolean;
  handleSelectMatch: (e: React.SyntheticEvent, _id: string) => void;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  refetchFunc?: () => void;
}

function MatchCard({ match, eventId, isChecked, handleSelectMatch, setActErr, refetchFunc }: MatchCardProps) {
  const user = useUser();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const actionItemEl = useRef<HTMLUListElement | null>(null);
  const deleteEl = useRef<HTMLDialogElement | null>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [deleteMatch, { loading }] = useMutation(DELETE_MATCH);

  // Precompute nets by round to avoid repeated filtering - optimized with direct assignment
  const netsByRoundId = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    for (let i = 0; i < match.nets.length; i++) {
      const net = match.nets[i];
      const roundId = net.round;
      if (!map.has(roundId)) {
        map.set(roundId, []);
      }
      map.get(roundId)!.push(net);
    }
    return map;
  }, [match.nets]);

  // Optimized status message calculation with early returns
  const statusMessage = useMemo(() => {
    if (match.completed) return 'COMPLETED';

    const rounds = match.rounds;
    for (let i = 0; i < rounds.length; i++) {
      const currRound = rounds[i];
      const roundNets = netsByRoundId.get(currRound._id) || [];

      // Check for INITIATE status
      if (currRound.teamAProcess === EActionProcess.INITIATE || currRound.teamBProcess === EActionProcess.INITIATE) {
        return 'SCHEDULED';
      }

      // Check for CHECKIN status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.CHECKIN || currRound.teamBProcess === EActionProcess.CHECKIN) {
        for (let j = 0; j < roundNets.length; j++) {
          const net = roundNets[j];
          if (!net.teamAScore || !net.teamBScore) {
            return `ROUND ${currRound.num} - ASSIGNING`;
          }
        }
      }

      // Check for LINEUP status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.LINEUP && currRound.teamBProcess === EActionProcess.LINEUP) {
        for (let j = 0; j < roundNets.length; j++) {
          const net = roundNets[j];
          if (!net.teamAScore || !net.teamBScore) {
            return `ROUND ${currRound.num} - LIVE`;
          }
        }
      }
    }

    return 'UPCOMING';
  }, [match.rounds, netsByRoundId, match.completed]);

  // Memoize status color to avoid recalculating
  const statusColor = useMemo(() => {
    if (statusMessage.includes('LIVE')) return 'bg-red-500 text-white';
    if (statusMessage.includes('ASSIGNING')) return 'bg-blue-500 text-white ';
    if (statusMessage === 'COMPLETED') return 'bg-green-500 text-white ';
    if (statusMessage === 'SCHEDULED') return 'bg-yellow-logo text-black';
    return 'bg-gray-500';
  }, [statusMessage]);

  // Add null check at the beginning
  if (!match.teamA || !match.teamB) {
    return (
      <div className="w-full bg-gray-800 relative rounded-lg p-4" style={{ minHeight: '6rem' }}>
        <div className="text-red-500">Invalid Match Data</div>
        <p className="text-white">{match.description || 'No description'}</p>
        <p className="text-gray-400 text-sm">Match ID: {match._id}</p>
      </div>
    );
  }

  useClickOutside(actionItemEl, () => {
    setActionOpen(false);
  });

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen((prevState) => !prevState);
  };

  const handleDeleteMatch = async (e: React.SyntheticEvent, matchId: string) => {
    e.preventDefault();
    try {
      const deletedMatch = await deleteMatch({ variables: { matchId } });
      console.log({ deletedMatch });
    } catch (err: any) {
      console.log(err);
      handleError({ error: err, setActErr });
    } finally {
      window.location.reload();
    }
  };

  /** ✅ Precompute team scores - optimized with direct array access */
  const teamScores = useMemo(() => {
    let teamA = 0;
    let teamB = 0;
    const rounds = match.rounds;

    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const roundNets = netsByRoundId.get(round._id) || [];
      teamA += calcRoundScore(roundNets, ETeam.teamA);
      teamB += calcRoundScore(roundNets, ETeam.teamB);
    }

    return { teamA, teamB };
  }, [match.rounds, netsByRoundId]);

  /** ✅ Team card reusable component - optimized with direct props */
  const TeamCard = React.memo(({ team, teamScore, teamE, won }: { team: ITeam; teamScore: number; teamE: ETeam; won: boolean }) => (
    <div className={`flex items-center ${teamE === ETeam.teamA ? 'flex-row' : 'flex-row-reverse'} gap-1 p-1 rounded-md ${won ? 'bg-green-600/20 border border-green-500' : ''}`}>
      <div className="flex-shrink-0">
        {team?.logo ? (
          <CldImage alt={team.name} width={24} height={24} className="w-12 h-12 object-contain" src={team.logo} />
        ) : (
          <TextImg fullText={team.name} className="w-12 h-12 object-contain rounded-xl" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-medium text-white capitalize break-words">{team?.name}</h5>
      </div>
      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border ${won ? 'border-green-500 bg-green-600 text-white' : 'border-gray-400 bg-white text-black'}`}>
        <span className="text-xs font-bold">{teamScore}</span>
      </div>
    </div>
  ));

  TeamCard.displayName = 'TeamCard';

  // const redirectSpectate=(e: React.SyntheticEvent)=>{
  //   e.preventDefault();
  //   router.push()

  // }

  console.log(user.info?.role);
  

  /** ✅ Reusable Action Buttons - optimized with useCallback */
  const ActionButtons = useCallback(
    ({ iconSize = 20 }: { iconSize?: number }) => {
      const iconClass = `w-${iconSize / 4} h-${iconSize / 4}`;

      return (
        <div className="flex justify-between items-center gap-2 mt-2 md:mt-0 relative">
          {(user.info?.role === UserRole.admin ||user.info?.role === UserRole.director) && <CheckboxInput name="bulk-match" defaultValue={isChecked} _id={match._id} handleInputChange={handleSelectMatch} />}
          {/* Spectate */}
          <Link href={`${FRONTEND_URL}/matches/${match._id}/scoreboard/${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
            <Image width={iconSize} height={iconSize} src="/icons/spectate.svg" alt="Spectate" className={iconClass} />
            <span className="text-[10px] md:text-xs uppercase mt-1">Full Scoreboard</span>
          </Link>

          {/* Captain */}
          <Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
            <Image width={iconSize} height={iconSize} src="/icons/captain.png" alt="Captain" className={iconClass} />
            <span className="text-[10px] md:text-xs uppercase mt-1">Captain</span>
          </Link>

          {/* Scorekeeper */}
          <Link href={`${FRONTEND_URL}/score-keeping/${match._id}/${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
            <Image width={iconSize} height={iconSize} src="/icons/scorekeeper.png" alt="Scorekeeper" className={iconClass} />
            <span className="text-[10px] md:text-xs uppercase mt-1">Scorekeeper</span>
          </Link>

          <Image src="/icons/dots-vertical.svg" height={20} width={20} alt="dot-vertical" className="w-4 svg-white" role="presentation" onClick={handleOpenAction} />
        </div>
      );
    },
    [user, match._id, ldoIdUrl],
  );

  /** ✅ Reusable Header - optimized with useCallback */
  const MatchHeader = useCallback(
    () => (
      <div className={`px-2 md:px-3 py-1 md:py-2 ${statusColor} text-xs font-semibold uppercase flex justify-between items-center rounded-t`}>
        <span>{statusMessage}</span>
        {match.location && <span>{match.location}</span>}
        <span>{readDate(match.date)}</span>
      </div>
    ),
    [statusColor, user.info?.role, isChecked, match._id, handleSelectMatch, statusMessage, match.location, match.date],
  );

  // Precompute values for TeamCard components
  const teamAWon = teamScores.teamA > teamScores.teamB && match.completed;
  const teamBWon = teamScores.teamB > teamScores.teamA && match.completed;

  return (
    <div className="relative">
      {/* Mobile View */}
      <div className="block md:hidden bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-2">
        <MatchHeader />

        <div className="grid grid-cols-2 gap-2 mt-1">
          <TeamCard team={match.teamA} teamScore={teamScores.teamA} teamE={ETeam.teamA} won={teamAWon} />
          <TeamCard team={match.teamB} teamScore={teamScores.teamB} teamE={ETeam.teamB} won={teamBWon} />
        </div>
        <ActionButtons iconSize={20} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-3">
        <MatchHeader />  
        <div className="flex flex-col items-center justify-between mt-2">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <TeamCard team={match.teamA} teamScore={teamScores.teamA} teamE={ETeam.teamA} won={teamAWon} />
            <TeamCard team={match.teamB} teamScore={teamScores.teamB} teamE={ETeam.teamB} won={teamBWon} />
          </div>
          <ActionButtons iconSize={24} />
        </div>
      </div>

      {/* Actions items start  */}
      {actionOpen && (
        <motion.ul
          ref={actionItemEl}
          className="absolute z-10 right-6 top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
            <React.Fragment>
              <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <Link href={`/${eventId}/matches/${match._id}/${ldoIdUrl}`}>Edit</Link>
              </li>
              <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <button type="button" onClick={(e) => deleteEl.current?.showModal()}>
                  Delete
                </button>
              </li>
            </React.Fragment>
          )}
          <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
            <Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`}>View</Link>
          </li>
        </motion.ul>
      )}
      {/* Actions items end */}
      <ConfirmDeleteDialog deleteEl={deleteEl} matchId={match._id} description={match?.description || null} handleDeleteMatch={handleDeleteMatch} />
    </div>
  );
}

export default React.memo(MatchCard);
