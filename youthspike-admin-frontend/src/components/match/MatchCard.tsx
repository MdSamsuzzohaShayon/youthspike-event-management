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

interface MatchCardProps {
  match: IMatch;
  sl: number;
  eventId: string;
}

function MatchCard({ match, sl, eventId }: MatchCardProps) {

  const actionItemEl = useRef<HTMLUListElement | null>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const user = useUser();

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }
  
  
  useClickOutside(actionItemEl, ()=>{
    setActionOpen(false);
  });

  return (
    <li className='w-full md:w-5/12 bg-gray-700 py-2 flex justify-between items-center relative rounded-lg' style={{ minHeight: '6rem' }}>

      {/* Actions items start  */}
      <ul ref={actionItemEl} className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-26 right-6 md:right-8 z-10 rounded-lg`}>
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (<li className='cursor-pointer'> <Link href={`/${eventId}/matches/${match._id}`} >Edit</Link></li>)}
        <li><Link href={`${FRONTEND_URL}/matches/${match._id}`}>View</Link> </li>
      </ul>
      {/* Actions items end */}

      <input type="checkbox" name="match-select" id="option" className='w-1/12' />
      <div className="w-10/12">
        <div className="w-full flex justify-center items-center">
          <p className="p-2 bg-yellow-500 text-gray-100 w-fit rounded-lg flex flex-col flex-center items-center">
            <span className='uppercase font-bold'> {validateMatchDatetime(match.date)}</span>
            <span>Date: {readDatetime(match.date)}</span>
          </p>
        </div>
        <div className="content w-full text-center mb-4 border-b border-gray-900 py-2">
          {/* <p className="capitalize">ID: {match._id}</p> */}
          <p className="capitalize">Location: {match.location}</p>
          <p className="capitalize">Divison: {match.division}</p>
        </div>
        <div className="teams w-full flex justify-between items-center">
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            {match?.teamA?.captain?.profile ? <AdvancedImage cldImg={cld.image(match.teamA.captain?.profile)} className="w-10 h-10 border-4 border-yellow-500 rounded-full" /> : <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />}

            <div className="match-name flex flex-col w-full">
              <h3 className='capitalize'>{match?.teamA?.name}</h3>
              {match?.teamA?.captain?.firstName && <p className='capitalize'>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p> }
            </div>
          </div>
          <div className="w-2/10 text-center"><p className='w-10 h-10 rounded-full bg-yellow-500 text-gray-100 flex items-center justify-center'>VS</p></div>
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            <div className="match-name flex flex-col w-full">
              <h3 className='capitalize'>{match?.teamB?.name}</h3>
              {match?.teamB?.captain && <p className='capitalize'>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p> }
            </div>
            {match?.teamB?.captain?.profile ? <AdvancedImage cldImg={cld.image(match.teamB.captain?.profile)} className="w-10 h-10 border-4 border-yellow-500 rounded-full" /> : <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />}
          </div>
        </div>
      </div>

      <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 md:h-10 svg-white' role="presentation" onClick={handleOpenAction} />
    </li>
  )
}

export default MatchCard;