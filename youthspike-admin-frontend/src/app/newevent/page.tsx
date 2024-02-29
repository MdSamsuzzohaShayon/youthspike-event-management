'use client'
import React, { useState } from 'react';
import Message from '@/components/elements/Message';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import { IError } from '@/types';
import Loader from '@/components/elements/Loader';

const EventNewPage = () => {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (isLoading) return <Loader />;

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='my-4 text-center'>New Event</h1>
      {actErr && <Message error={actErr} />}
      <EventAddUpdate update={false} setActErr={setActErr} setIsLoading={setIsLoading} />
    </div>
  )
}

export default EventNewPage;