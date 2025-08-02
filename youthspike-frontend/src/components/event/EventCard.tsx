import { IEvent } from '@/types/event';
import Link from 'next/link';
import React from 'react';
import { useLdoId } from '@/lib/LdoProvider';
import { readDate } from '@/utils/datetime';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';

interface IEventCardProps {
  event: IEvent;
}

function EventCard({ event }: IEventCardProps) {
  const { ldoIdUrl } = useLdoId();

  return (
    <div className="box p-6 bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
      <div className="img-wrapper flex justify-center items-center mb-4">
        {event.logo ? <CldImage alt={event.name} width="200" height="200" className="w-24 h-24 object-cover rounded-full border-4 border-yellow-400 shadow-lg"  src={event.logo} /> 
        : <TextImg className="w-24 h-24 object-cover rounded-full border-4 border-yellow-400 shadow-lg" fullText={event.name} />}
      </div>
      <div className="text-box text-center">
        <h3 className="text-2xl font-semibold text-yellow-400 mb-2">{event.name}</h3>
        <p className="text-sm text-gray-300 mb-2">
          {readDate(event.startDate)} - {readDate(event.endDate)}
        </p>
        <p className="text-sm text-gray-400 mb-4">{event.location}</p>
        <Link href={`/events/${event._id}/${ldoIdUrl}`} className="px-6 py-2 bg-yellow-logo text-black font-semibold rounded-md shadow-md hover:bg-yellow-600 transition-colors duration-300">
          View Event
        </Link>
      </div>
    </div>
  );
}

export default EventCard;
