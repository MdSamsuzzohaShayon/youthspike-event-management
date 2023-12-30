import { INetRelatives } from '@/types';
import React from 'react';
import NetCard from './NetCard';

interface INetListProps {
  netList: INetRelatives[];
  eventId: string;
}

function NetList({ netList, eventId }: INetListProps) {
  return (
    <div className='NetList flex flex-col items-center justify-between gap-2'>
      {netList && netList.map((net) => <NetCard key={net._id} net={net} eventId={eventId} />)}
    </div>
  )
}

export default NetList;