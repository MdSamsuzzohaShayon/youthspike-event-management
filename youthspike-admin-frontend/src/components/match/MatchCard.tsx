import { useUser } from '@/lib/UserProvider';
import { IMatchExpRel } from '@/types/match';
import { UserRole } from '@/types/user';
import { FRONTEND_URL } from '@/utils/keys';
import Link from 'next/link';
import React, { useMemo, useRef, useState } from 'react';
import useClickOutside from '../../hooks/useClickOutside';
import { DELETE_MATCH } from '@/graphql/matches';
import { IMessage, INetRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { calcRoundScore } from '@/utils/helper';
import { useLdoId } from '@/lib/LdoProvider';
import { motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { handleError } from '@/utils/handleError';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { useMutation } from '@apollo/client/react';
import MatchHeader from './MatchHeader';
import TeamCard from './TeamCard';
import ActionButtons from './ActionButtons';

interface MatchCardProps {
  match: IMatchExpRel;
  sl: number;
  isChecked: boolean;
  eventId: string;
  handleSelectMatch: (e: React.SyntheticEvent, _id: string) => void;
  setMessage: (message: Omit<IMessage, "id">) => void;
}

function MatchCard({ match, isChecked, eventId, handleSelectMatch, setMessage }: MatchCardProps) {
  const user = useUser();
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



  const handleDeleteMatch = async (e: React.SyntheticEvent, matchId: string) => {
    e.preventDefault();
    try {
      const deletedMatch = await deleteMatch({ variables: { matchId } });
      console.log({ deletedMatch });
    } catch (err: any) {
      console.log(err);
      handleError({ error: err, setMessage });
    } finally {
      window.location.reload();
    }
  };

  /** ✅ Precompute team scores - optimized with direct array access */
  const teamScores = useMemo(() => {
    if(match.teamAFScore && match.teamBFScore){
      return { teamA: match.teamAFScore, teamB: match.teamBFScore };
    }
    let teamA = 0;
    let teamB = 0;
    const rounds = match.rounds;

    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const roundNets = netsByRoundId.get(round._id) || [];
      teamA += calcRoundScore(roundNets, ETeam.teamA);
      teamB += calcRoundScore(roundNets, ETeam.teamB);
    }
    teamA += (match.teamAP || 0);
    teamB += (match.teamBP || 0);

    return { teamA, teamB };
  }, [match.rounds, netsByRoundId]);



  // Precompute values for TeamCard components
  const teamAWon = teamScores.teamA > teamScores.teamB && match.completed;
  const teamBWon = teamScores.teamB > teamScores.teamA && match.completed;




  return (
    <div className="relative">
      {/* Mobile View */}
      <div className="block md:hidden bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-2">
        <MatchHeader match={match} netsByRoundId={netsByRoundId} />

        <div className="grid grid-cols-2 gap-2 mt-1">
          <TeamCard team={match.teamA} teamScore={teamScores.teamA} teamE={ETeam.teamA} won={teamAWon}
          />
          <TeamCard team={match.teamB} teamScore={teamScores.teamB} teamE={ETeam.teamB} won={teamBWon}
          />
        </div>
        <ActionButtons handleSelectMatch={handleSelectMatch} isChecked={isChecked} match={match} setActionOpen={setActionOpen} iconSize={20} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-3">
        <MatchHeader match={match} netsByRoundId={netsByRoundId} />
        <div className="flex flex-col items-center justify-between mt-2">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <TeamCard team={match.teamA} teamScore={teamScores.teamA} teamE={ETeam.teamA} won={teamAWon}
            />
            <TeamCard team={match.teamB} teamScore={teamScores.teamB} teamE={ETeam.teamB} won={teamBWon}
            />
          </div>
          <ActionButtons handleSelectMatch={handleSelectMatch} isChecked={isChecked} match={match} setActionOpen={setActionOpen} iconSize={24} />
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

export default MatchCard;
