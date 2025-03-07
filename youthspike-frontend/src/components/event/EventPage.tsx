import React from 'react';
import { imgW } from '@/utils/constant';
import { APP_NAME } from '@/utils/keys';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import getEvents from '@/app/_fetch/match';
import EventMain from './EventMain';



async function EventPage() {
  const eventsData = await getEvents();

  if (!eventsData) {
    notFound();
  }
  

  return (
    <div className="container mx-auto px-2 min-h-screen">
      <div className="logo-wrapper w-full flex items-center justify-center mt-4">
        <Image src="/free-logo.png" height={imgW.xs} width={imgW.xs} alt={APP_NAME} className="w-32" />
      </div>
      <h1 className="mt-8">Events</h1>
      {/* Event Main  */}
      <EventMain events={eventsData} />
    </div>
  );
}

export default EventPage;
