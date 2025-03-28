import cld from '@/config/cloudinary.config';
import { IEvent } from '@/types/event';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React from 'react';
import { useLdoId } from '@/lib/LdoProvider';
import { readDate } from '@/utils/datetime';

interface IEventCardProps {
  event: IEvent;
}



function EventCard({ event }: IEventCardProps) {
  const { ldoIdUrl } = useLdoId();


  return (
    <div key={event._id} className="box p-6 bg-gray-800 hover:shadow-2xl transition-shadow duration-300">
      <a href={`/events/${event._id}`} className="block">
        <div className="img-wrapper flex justify-center items-center mb-4">
          <AdvancedImage className="w-24 h-24 object-cover rounded-full border-4 border-yellow-400 shadow-lg" alt={event.name} cldImg={cld.image(event.logo)} />
        </div>
        <div className="text-box text-center">
          <h3 className="text-2xl font-semibold text-yellow-400 mb-2">{event.name}</h3>
          <p className="text-sm text-gray-300 mb-2">
            {readDate(event.startDate)} - {readDate(event.endDate)}
          </p>
          <p className="text-sm text-gray-400 mb-4">{event.location}</p>
          <Link href={`/events/${event._id}/${ldoIdUrl}`} className="px-6 py-2 bg-yellow-500 text-gray-800 font-semibold rounded-md shadow-md hover:bg-yellow-600 transition-colors duration-300">
            View Event
          </Link>
        </div>
      </a>
    </div>
  );
}

export default EventCard;
