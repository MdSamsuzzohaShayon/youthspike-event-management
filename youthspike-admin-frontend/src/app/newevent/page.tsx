import EventAddUpdate from '@/components/event/EventAddUpdate';

function EventNewPage() {
  return (
    <div className="container mx-auto px-4 min-h-screen overflow-x-hidden">
      <h1 className="text-3xl font-bold text-center text-yellow-logo mb-6">Create a New Event</h1>
      <EventAddUpdate update={false} />
    </div>
  );
}

export default EventNewPage;
