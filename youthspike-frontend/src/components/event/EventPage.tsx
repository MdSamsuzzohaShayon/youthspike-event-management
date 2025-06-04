/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import EventMain from './EventMain';
import { getEvents } from '@/app/_requests/event';

async function EventPage() {
  const eventsData = await getEvents();

  if (!eventsData) {
    notFound();
  }

  return (
    <div className="event-wrapper w-full min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Logo Section */}
        <div className="logo-wrapper w-full flex items-center justify-center mt-8">
          <Image alt="American Spikers League" loading="lazy" width={200} height={200} decoding="async" className="w-32" style={{ color: 'transparent' }} src="/free-logo.png" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-center mt-8 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Events</h1>

        <EventMain events={eventsData} />

        {/* Pagination Section */}
        {/* <div className="pagination-wrapper w-full mt-8 flex justify-center">
          <button type="button" className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors duration-300">
            Load More
          </button>
        </div> */}
      </div>
    </div>
  );
}

/* <EventMain events={eventsData} /> */

export default EventPage;
