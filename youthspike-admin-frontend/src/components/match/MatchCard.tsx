import cld from '@/config/cloudinary.config';
import { IMatch } from '@/types/match';
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

  return (
    <li className='w-full bg-gray-700 py-2 flex justify-between items-center relative' style={{ minHeight: '6rem' }}>
      <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 z-10 rounded-lg`}>
        <li> <Link href={`/${eventId}/matches/${match._id}`} >Edit</Link></li>
        <li> Start</li>
      </ul>

      <input type="checkbox" name="match-select" id="option" className='w-1/12' />
      <div className="w-10/12 flex justify-between items-center">
        <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
          {match?.teamA?.captain?.profile ? <AdvancedImage cldImg={cld.image(match.teamA.captain?.profile)} className="w-10 h-10 border-4 border-yellow-500 rounded-full" /> : <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />}

          <div className="match-name flex flex-col w-full">
            <h3>{match?.teamA?.name}</h3>
            <p>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p>
          </div>
        </div>
        <div className="w-2/10 text-center"><p className='w-10 h-10 rounded-full bg-yellow-500 text-gray-100 flex items-center justify-center'>VS</p></div>
        <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
          <div className="match-name flex flex-col w-full">
            <h3>{match?.teamB?.name}</h3>
            <p>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p>
          </div>
          {match?.teamB?.captain?.profile ? <AdvancedImage cldImg={cld.image(match.teamB.captain?.profile)} className="w-10 h-10 border-4 border-yellow-500 rounded-full" /> : <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full" />}
        </div>
      </div>

      <img src="/icons/dots-vertical.svg" alt="dot-vertical" className='w-1/12 svg-white' role="presentation" onClick={handleOpenAction} />
    </li>
  )
}

export default MatchCard;