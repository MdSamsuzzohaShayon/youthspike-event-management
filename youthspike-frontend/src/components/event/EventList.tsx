import { IEventWMatch } from '@/types';
import EventCard from './EventCard';

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
