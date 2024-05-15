import { useAppSelector } from '@/redux/hooks';
import { IEvent } from '@/types/event';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface IEventCardProps {
  event: IEvent;
}

// Create an array of month names
const monthNames: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function EventCard({ event }: IEventCardProps) {
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);

  return (
    <div key={event._id} style={{ width: screenWidth <= 768 ? '48.5%' : '24.6%' }} className="box mb-1 p-2 h-48 bg-gray-700 flex justify-around items-center flex-col gap-2 rounded-md">
      <Link href={`/events/${event._id}`}>
        <div className="img-wrapper w-full flex justify-center items-center">
          <Image height={20} width={20} src="/free-logo.png" alt="plus" className="w-12" />
        </div>
        <div className="text-box text-center">
          <h3 className="text-lg font-bold mb-0">{event.name}</h3>
          <p style={{ fontSize: '0.7rem' }}>
            {`${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `} -{' '}
            {`${monthNames[new Date(event.endDate).getMonth()]} ${new Date(event.endDate).getDate()}, ${new Date(event.endDate).getFullYear()} `}
          </p>
          {event.description && <p>{event.description}</p> }
        </div>
      </Link>
    </div>
  );
}

export default EventCard;
