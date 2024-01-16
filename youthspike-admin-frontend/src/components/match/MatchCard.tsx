import cld from '@/config/cloudinary.config';
import { IMatch } from '@/types/match';
import { FRONTEND_URL } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useState } from 'react';

interface MatchCardProps {
  match: IMatch;
  sl: number;
  eventId: string;
}

function MatchCard({ match, sl, eventId }: MatchCardProps) {

  const [actionOpen, setActionOpen] = useState<boolean>(false);

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen(prevState => !prevState);
  }
  // http://localhost:3001/matches/659c1efa9252ab57f456b62b

  return (
    <li className='w-full bg-gray-700 py-2 flex justify-between items-center relative rounded-lg' style={{ minHeight: '6rem' }}>
      <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-26 right-6 md:right-16 z-10 rounded-lg`}>
        <li className='cursor-pointer'> <Link href={`/${eventId}/matches/${match._id}`} >Edit</Link></li>
        <li><Link href={`${FRONTEND_URL}/matches/${match._id}`}>View          </Link>        </li>
      </ul>

      <input type="checkbox" name="match-select" id="option" className='w-1/12' />
      <div className="w-10/12">
        <div className="content w-full text-center mb-4 border-b border-gray-900 py-2">
          <h3>ID: {match._id}</h3>
          <p>Location: {match.location}</p>
          <p>Divisons: {match.divisions}</p>
        </div>
        <div className="teams w-full flex justify-between items-center">
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            {match?.teamA?.captain?.profile ? <AdvancedImage cldImg={cld.image(match.teamA.captain?.profile)} className="w-10 h-10 border-4 border-yellow-500 rounded-full" /> : <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />}

            <div className="match-name flex flex-col w-full">
              <h3>{match?.teamA?.name}</h3>
              <p className='capitalize'>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p>
            </div>
          </div>
          <div className="w-2/10 text-center"><p className='w-10 h-10 rounded-full bg-yellow-500 text-gray-100 flex items-center justify-center'>VS</p></div>
          <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
            <div className="match-name flex flex-col w-full">
              <h3>{match?.teamB?.name}</h3>
              <p className='capitalize'>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p>
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