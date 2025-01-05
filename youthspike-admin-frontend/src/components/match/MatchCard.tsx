import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { IMatchExpRel } from '@/types/match';
import { UserRole } from '@/types/user';
import { FRONTEND_URL } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { readDate, readDateTemp } from '@/utils/datetime';
import useClickOutside from '../../hooks/useClickOutside';
import { useMutation } from '@apollo/client';
import { DELETE_MATCH } from '@/graphql/matches';
import PointsByRound from './PointsByRound';
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/helper';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';

interface MatchCardProps {
  match: IMatchExpRel;
  sl: number;
  eventId: string;
  isChecked: boolean;
  handleSelectMatch: (e: React.SyntheticEvent, _id: string) => void;
  refetchFunc?: () => Promise<void>;
}

function MatchCard({ match, eventId, isChecked, handleSelectMatch, refetchFunc }: MatchCardProps) {

  const user = useUser();
  const { ldoIdUrl } = useLdoId();

  const actionItemEl = useRef<HTMLUListElement | null>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [deleteMatch, { loading }] = useMutation(DELETE_MATCH);
  const [roundList, setRoundList] = useState<IRoundRelatives[]>(match?.rounds ? match.rounds : []);
  // @ts-ignore
  const [allNets, setAllNets] = useState<INetRelatives[]>(match?.nets ? match.nets.map((n) => ({ ...n, round: n.round._id })) : []);



  useClickOutside(actionItemEl, () => {
    setActionOpen(false);
  });

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }


  const handleDeleteMatch = async (e: React.SyntheticEvent, matchId: string) => {
    e.preventDefault();
    await deleteMatch({ variables: { matchId } });
    if (refetchFunc) await refetchFunc();
  }




  const teamCard = (team: ITeam, teamE: ETeam) => {
    let pointsOfRound = 0;
    roundList.forEach((r) => {
      const score = calcRoundScore(allNets.filter((n) => n.round === r._id), r, teamE);
      pointsOfRound += score;
    });
    return (<React.Fragment>
      <div className="advanced-img w-14">
        {team?.logo
          ? <AdvancedImage cldImg={cld.image(team?.logo)} className="w-full h-full" />
          : <img src='/free-logo.png' className='w-full h-full' />}
      </div>
      <h3 className='capitalize'>{team?.name}</h3>
      <h1 className="h-12 w-12 flex justify-center items-center rounded-full border border-gray-100">{pointsOfRound}</h1>
    </React.Fragment>);
  }



  return (
    <div className='w-full bg-gray-700 relative rounded-lg' style={{ minHeight: '6rem' }}>

      {/* ===== LEVEL 1 START ===== */}
      <div className="level-1 w-full flex justify-between px-2 md:px-6 mt-2 md:mt-6 md:py-4 py-2">
        {user.info?.role === UserRole.admin || user.info?.role === UserRole.director
          ? (<CheckboxInput name='bulk-match' defaultValue={isChecked} _id={match._id} handleInputChange={handleSelectMatch} />)
          : <div className='w-4' />}

        <div className="w-10/12 flex items-center justify-center">
          {/* <h2>Match Name</h2> */}
          <Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`} className='btn-info' >Enter</Link>
        </div>
        <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 md:h-10 svg-white' role="presentation" onClick={handleOpenAction} />
      </div>
      {/* ===== LEVEL 1 END ===== */}


      {/* ===== LEVEL 2 START ===== */}
      <div className="lavel-2 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">
        {teamCard(match?.teamA, ETeam.teamA)}
      </div>
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
            {roundList.map((round) => <li key={round._id} className='w-12 flex justify-center items-center text-yellow-logo'>RD{round.num}</li>)}
          </ul>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center">
            <PointsByRound roundList={roundList} allNets={allNets} teamE={ETeam.teamA} />
          </div>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            <PointsByRound roundList={roundList} allNets={allNets} teamE={ETeam.teamB} dark />
          </div>
        </div>
        <div className="">
          <img src="/icons/share.svg" alt="share-icon" className="w-6 svg-white" />
        </div>
      </div>
      {/* ===== LEVEL 3 END ===== */}

      {/* ===== LEVEL 4 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">
        {teamCard(match?.teamB, ETeam.teamB)}
      </div>
      {/* ===== LEVEL 4 END ===== */}

      {/* ===== LEVEL 5 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-start px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <div className="w-3/6">
          <p className='flex justify-start items-center gap-x-2 mb-2'>
            <span><img src='/icons/clock.svg' className='w-6 svg-white' /></span>
            <span>{readDate(match.date)}</span>
          </p>
          {/* <p className='flex justify-start items-center gap-x-2'>
            <span><img src='/icons/date.svg' className='w-6 svg-white' /></span>
            <span>Start {readTime(match.date)}</span>
          </p> */}
        </div>
        <div className="w-3/6 text-end">
          {match.location && (
            <p className='flex justify-start items-center gap-x-2'>
              <span><img src='/icons/location.svg' className='w-6 svg-white' /></span>
              <span>{match.location}</span>
            </p>
          )}
        </div>
      </div>
      {/* ===== LEVEL 5 END ===== */}

      <div className="w-full px-2 md:px-6 mt-2 md:mt-6 pb-2">
        {match.description && (
          <p className='flex justify-start items-center gap-x-2'>
            <span><img src='/icons/pencil.svg' className='w-6 svg-white' /></span>
            <span>{match.description}</span>
          </p>
        )}
      </div>


      {/* Actions items start  */}
      <ul ref={actionItemEl} className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-4 right-8 md:right-14 md:right-8 z-10 rounded-lg`}>
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <React.Fragment>
            <li className='cursor-pointer'> <Link href={`/${eventId}/matches/${match._id}/${ldoIdUrl}`} >Edit</Link></li>
            <li className='cursor-pointer'> <button type='button' onClick={(e) => handleDeleteMatch(e, match._id)}>Delete</button></li>
          </React.Fragment>
        )}
        <li><Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`}>View</Link> </li>
      </ul>
      {/* Actions items end */}
    </div>
  )
}

export default MatchCard;