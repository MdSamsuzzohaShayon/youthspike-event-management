import { IEventWMatch } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { EEventPeriod } from '@/types/event';
import { validateMatchDatetime } from '@/utils/datetime';
import { useLdoId } from '@/lib/LdoProvider';
import EventCard from './EventCard';


const EVENT_PAGE_LIMIT = 10;



function EventList({ eventList }: { eventList: IEventWMatch[] }) {

  

  return (
    <div className="event-list mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Card */}
          {eventList.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </div>
  );
}

export default EventList;
