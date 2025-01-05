'use client';

import React, { useState } from 'react';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import Loader from '@/components/elements/Loader';

function EventNewPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (isLoading) return <Loader />;

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="my-4 text-center">New Event</h1>
      <div className="new-event-wrapper mb-5">
        <EventAddUpdate update={false} setIsLoading={setIsLoading} />
      </div>
    </div>
  );
}

export default EventNewPage;
