import { IEvent } from '@/types'
import React from 'react'
import EventCard from './EventCard'

function EventList({eventList}: {eventList: IEvent[]}) {
  return (
    <div className='EventList'>
      {eventList.length > 0 && eventList.map((event: IEvent) => (
          <EventCard key={event._id} event={event} />
        ))}
    </div>
  )
}

export default EventList