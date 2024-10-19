import { useLdoId } from '@/lib/LdoProvider';
import { IRoundRelatives } from '@/types';
import Link from 'next/link';
import React from 'react';

interface IRoundCardProps {
  round: IRoundRelatives;
  eventId: string;
}

function RoundCard({ round, eventId }: IRoundCardProps) {
  const {ldoIdUrl} = useLdoId();

  return (
    <div className='w-full bg-gray-700 rounded-lg p-2'>
      <Link href={`/${eventId}/rounds/${round._id}/${ldoIdUrl}`} className='w-full flex justify-between item-center gap-1'>
        <div className="left w-3/6">
          <p>Round Number: {round.num}</p>
          <p>Total Nets: {round.nets.length}</p>
        </div>
        <div className="right w-3/6">
          <p>Team A Score: {round.teamAScore ? round.teamAScore : 0}</p>
          <p>Team B Score: {round.teamBScore ? round.teamBScore : 0}</p>
        </div>
      </Link>
    </div>
  )
}

export default RoundCard;