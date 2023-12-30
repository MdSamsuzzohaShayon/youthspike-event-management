import { IRoundRelatives } from '@/types';
import React from 'react';
import RoundCard from './RoundCard';

interface IRoundListProps {
  roundList: IRoundRelatives[],
  eventId: string;
}

function RoundList({ roundList , eventId}: IRoundListProps) {
  return (
    <div className='RoundList flex flex-col items-center justify-between gap-2'>
      {roundList && roundList.map((round) => <RoundCard key={round._id} round={round} eventId={eventId} />)}
    </div>
  )
}

export default RoundList;