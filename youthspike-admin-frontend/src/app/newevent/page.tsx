import EventAddUpdate from "@/components/event/EventAddUpdate";

function EventNewPage() {

  return (
    <div className="container mx-auto px-6 py-10 min-h-screen flex justify-center items-center">
      <div className="bg-gray-900 p-2 md:p-8 rounded-xl shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-6">Create a New Event</h1>
        <EventAddUpdate update={false} />
      </div>
    </div>
  );
}

export default EventNewPage;
