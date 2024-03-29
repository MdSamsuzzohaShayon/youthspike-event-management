import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { IMatch } from '@/types/match';
import { UserRole } from '@/types/user';
import { FRONTEND_URL } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { readDatetime, validateMatchDatetime } from '@/utils/datetime';
import useClickOutside from '../../../hooks/useClickOutside';
import { useMutation } from '@apollo/client';
import { DELETE_MATCH } from '@/graphql/matches';
import TextImg from '../elements/TextImg';

interface MatchCardProps {
  match: IMatch;
  sl: number;
  eventId: string;
  refetchFunc?: () => Promise<void>;
}

function MatchCard({ match, sl, eventId, refetchFunc }: MatchCardProps) {

  const actionItemEl = useRef<HTMLUListElement | null>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const user = useUser();
  const [deleteMatch, { loading }] = useMutation(DELETE_MATCH);


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


  return (
    <li className='w-full md:w-5/12 bg-gray-700 py-2 flex justify-between items-center relative rounded-lg' style={{ minHeight: '6rem' }}>

      {/* Actions items start  */}
      <ul ref={actionItemEl} className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-26 right-6 md:right-8 z-10 rounded-lg`}>
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <React.Fragment>
            <li className='cursor-pointer'> <Link href={`/${eventId}/matches/${match._id}`} >Edit</Link></li>
            <li className='cursor-pointer'> <button type='button' onClick={(e) => handleDeleteMatch(e, match._id)}>Delete</button></li>
          </React.Fragment>
        )}
        <li><Link href={`${FRONTEND_URL}/matches/${match._id}`}>View</Link> </li>
      </ul>
      {/* Actions items end */}

      <input type="checkbox" name="match-select" id="option" className='w-1/12' />
      <div className="w-10/12">
        {/* <div className="w-full flex justify-center items-center">
          <p className="p-2 bg-yellow-logo text-black w-fit rounded-lg flex flex-col flex-center items-center">
            <span className='uppercase font-bold'> {validateMatchDatetime(match.date)}</span>
            <span>Date: {readDatetime(match.date)}</span>
          </p>
        </div> */}
        <div className="content w-full text-center mb-4 border-b border-gray-900 py-2">
          {/* <p className="capitalize">ID: {match._id}</p> */}
          <p className="capitalize">Location: {match.location}</p>
          <p className="capitalize">Divison: {match.division}</p>
          <p className="capitalize" >Date: {readDatetime(match.date)}</p>
        </div>
        <div className="teams w-full flex justify-between items-center">
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            <div className="logo-wrapper w-1/6">
              {match?.teamA?.logo
                ? <AdvancedImage cldImg={cld.image(match?.teamA?.logo)} className="w-10 h-10 border-4 border-yellow-logo rounded-full" />
                : <TextImg className='w-8 h-8 border-4 border-yellow-logo rounded-full' fullText={match?.teamA?.name} />}
            </div>

            <div className="match-name flex flex-col w-5/10l">
              <h3 className='capitalize'>{match?.teamA?.name}</h3>
              {match?.teamA?.captain?.firstName && <p className='capitalize'>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p>}
            </div>
          </div>
          <div className="w-2/10 text-center"><p className='w-8 h-8 rounded-full bg-yellow-logo text-gray-900 flex items-center justify-center'>VS</p></div>
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            <div className="match-name flex flex-col w-5/6">
              <h3 className='capitalize'>{match?.teamB?.name}</h3>
              {match?.teamB?.captain && <p className='capitalize'>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p>}
            </div>
            <div className="logo-wrapper w-1/6">
              {match?.teamB?.logo
                ? <AdvancedImage cldImg={cld.image(match?.teamB?.logo)} className="w-10 h-10 border-4 border-yellow-logo rounded-full" />
                : <TextImg className='w-8 h-8 border-4 border-yellow-logo rounded-full' fullText={match?.teamB?.name} />}
            </div>
          </div>
        </div>
      </div>

      <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 md:h-10 svg-white' role="presentation" onClick={handleOpenAction} />
    </li>
  )
}

export default MatchCard;