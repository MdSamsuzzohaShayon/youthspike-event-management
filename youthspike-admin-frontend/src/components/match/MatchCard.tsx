import { useUser } from '@/lib/UserProvider';
import { IMatchExpRel } from '@/types/match';
import { UserRole } from '@/types/user';
import { FRONTEND_URL } from '@/utils/keys';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { readDate, readDateTemp } from '@/utils/datetime';
import useClickOutside from '../../hooks/useClickOutside';
import { ApolloError, useMutation } from '@apollo/client';
import { DELETE_MATCH } from '@/graphql/matches';
import PointsByRound from './PointsByRound';
import { IError, INetRelatives, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/helper';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { handleError } from '@/utils/handleError';
import Image from 'next/image';
import TextImg from '../elements/TextImg';

interface MatchCardProps {
  match: IMatchExpRel;
  sl: number;
  eventId: string;
  isChecked: boolean;
  handleSelectMatch: (e: React.SyntheticEvent, _id: string) => void;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  refetchFunc?: () => Promise<void>;
}

function MatchCard({ match, eventId, isChecked, handleSelectMatch, setActErr, refetchFunc }: MatchCardProps) {
  const user = useUser();
  const { ldoIdUrl } = useLdoId();

  const actionItemEl = useRef<HTMLUListElement | null>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [deleteMatch, { loading }] = useMutation(DELETE_MATCH);
  const [roundList, setRoundList] = useState<IRoundRelatives[]>(match?.rounds ? match.rounds : []);
  // @ts-ignore
  const [allNets, setAllNets] = useState<INetRelatives[]>(match?.nets ? match.nets.map((n) => ({ ...n, round: n.round?._id || n.round })) : []);

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

  const teamCard = (team: ITeam, teamE: ETeam) => {
    let myPointsOfRound = 0;
    let opPointsOfRound = 0;
    const mE = teamE;
    const oE = teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;

    roundList.forEach((r) => {
      const myScore = calcRoundScore(
        allNets.filter((n) => n.round === r._id),
        r,
        mE,
      );
      const opScore = calcRoundScore(
        allNets.filter((n) => n.round === r._id),
        r,
        oE,
      );
      myPointsOfRound += myScore;
      opPointsOfRound += opScore;
    });
    let win = myPointsOfRound > opPointsOfRound;

    return (
      <React.Fragment>
        <div className="advanced-img w-14">
          {team?.logo ? <CldImage width={100} height={100} alt="team logo" src={team?.logo} className="w-full h-full" /> : <TextImg className="w-full h-full" fullText={team.name} />}
        </div>
        <h3 className={`text-2xl md:text-3xl font-semibold text-white capitalize text-center ${match.completed && win ? 'bg-green-600 text-white p-2 rounded-lg' : ''}`}>{team?.name}</h3>
        <h1 className={`h-12 w-12 flex justify-center items-center rounded-full border border-gray-100 ${match.completed && win ? 'bg-green-600' : ''}`}>{myPointsOfRound}</h1>
      </React.Fragment>
    );
  };

  return (
    <div className="w-full bg-gray-800 relative rounded-lg" style={{ minHeight: '6rem' }}>
      {/* ===== LEVEL 1 START ===== */}
      <div className="level-1 w-full flex justify-between px-2 md:px-6 mt-2 md:mt-6 md:py-4 py-2">
        {user.info?.role === UserRole.admin || user.info?.role === UserRole.director ? (
          <CheckboxInput name="bulk-match" defaultValue={isChecked} _id={match._id} handleInputChange={handleSelectMatch} />
        ) : (
          <div className="w-4" />
        )}

        <div className="w-10/12 flex items-center justify-center">
          {/* <h2>Match Name</h2> */}
          <a href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`} className="btn-info">
            Enter
          </a>
        </div>
        <img src="/icons/dots-vertical.svg" alt="dot-vertical" className="w-1/12 md:h-10 svg-white" role="presentation" onClick={handleOpenAction} />
      </div>
      {/* ===== LEVEL 1 END ===== */}

      {/* ===== LEVEL 2 START ===== */}
      <div className="lavel-2 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamA, ETeam.teamA)}</div>
      {/* ===== LEVEL 2 END ===== */}

      {/* ===== LEVEL 3 START ===== */}
      <div className="lavel-3 w-full flex justify-center items-center px-2 md:px-6 mt-2 md:mt-6 gap-x-2">
        <div className="">
          <Link href={`/${eventId}/matches/${match._id}/${ldoIdUrl}`}>
            <img src="/icons/setting.svg" alt="setting-icon" className="w-6 svg-white" />
          </Link>
        </div>
        <div className="rounds flex flex-col justify-center items-center w-full ">
          <ul className="round-numbers w-full flex justify-center items-center gap-x-1">
            {roundList.map((round, i) => (
              <li key={round._id} className="w-12 flex justify-center items-center text-yellow-logo">
                {match.extendedOvertime && i === roundList.length - 1 ? 'OT' : 'RD' + round.num}
              </li>
            ))}
          </ul>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center">
            <PointsByRound roundList={roundList} allNets={allNets} teamE={ETeam.teamA} />
          </div>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            <PointsByRound roundList={roundList} allNets={allNets} teamE={ETeam.teamB} dark />
          </div>
        </div>
        <div className="">{/* <img src="/icons/share.svg" alt="share-icon" className="w-6 svg-white" /> */}</div>
      </div>
      {/* ===== LEVEL 3 END ===== */}

      {/* ===== LEVEL 4 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamB, ETeam.teamB)}</div>
      {/* ===== LEVEL 4 END ===== */}

      {/* ===== LEVEL 5 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-start px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <div className="w-3/6">
          <p className="flex justify-start items-center gap-x-2 mb-2">
            <span>
              <img src="/icons/clock.svg" className="w-6 svg-white" />
            </span>
            <span>{readDate(match.date)}</span>
          </p>
          {/* <p className='flex justify-start items-center gap-x-2'>
            <span><img src='/icons/date.svg' className='w-6 svg-white' /></span>
            <span>Start {readTime(match.date)}</span>
          </p> */}
        </div>
        <div className="w-3/6 text-end">
          {match.location && (
            <p className="flex justify-start items-center gap-x-2">
              <span>
                <img src="/icons/location.svg" className="w-6 svg-white" />
              </span>
              <span>{match.location}</span>
            </p>
          )}
        </div>
      </div>
      {/* ===== LEVEL 5 END ===== */}

      <div className="w-full px-2 md:px-6 mt-2 md:mt-6 pb-2">
        {match.description && (
          <p className="flex justify-start items-center gap-x-2">
            <span>
              <img src="/icons/pencil.svg" className="w-6 svg-white" />
            </span>
            <span>{match.description}</span>
          </p>
        )}
      </div>

      {/* Actions items start  */}
      {actionOpen && (
        <motion.ul
          className="absolute z-10 right-6 top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {/* <li role="presentation" className='px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' onClick={(e) => (player.email && player.email.trim() !== '' ? handleMakeCaptain(e, player._id) : handleOpenDialog(e, UserRole.captain))}>

                        Make Captain
                      </li> */}
          {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
            <React.Fragment>
              <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                {' '}
                <Link href={`/${eventId}/matches/${match._id}/${ldoIdUrl}`}>Edit</Link>
              </li>
              <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                {' '}
                <button type="button" onClick={(e) => handleDeleteMatch(e, match._id)}>
                  Delete
                </button>
              </li>
            </React.Fragment>
          )}
          <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
            <Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`}>View</Link>{' '}
          </li>
        </motion.ul>
      )}
      {/* Actions items end */}
    </div>
  );
}

export default MatchCard;
