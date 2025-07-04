import { getMinEvents } from '@/app/_requests/events';
import { IEventExpRel } from '@/types';
import { LDO_ID } from '@/utils/constant';
import { readDate } from '@/utils/datetime';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

async function EventsPage() {
  const events: IEventExpRel[] = await getMinEvents();

  if (!events) {
    return notFound();
  }

  return (
    <div className="min-h-screen px-6 py-10 md:px-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center mb-6">
          Upcoming Events
        </h2>

        <div className="overflow-hidden shadow-lg rounded-lg border border-gray-700">
          <table className="w-full border-collapse">
            <thead className="bg-yellow-400 text-black">
              <tr>
                <th className="py-4 px-6 text-left">Event Name</th>
                <th className="py-4 px-6 text-left">Start Date</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {events.map((evt) => (
                <tr key={evt._id} className="hover:bg-gray-900 transition">
                  <td className="py-4 px-6">{evt.name}</td>
                  <td className="py-4 px-6">{readDate(evt.startDate)}</td>
                  <td className="py-4 px-6 text-center">
                    <Link
                      href={`/${evt._id}?${LDO_ID}=${evt?.ldo?._id}`}
                      className="inline-block bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition hover:bg-yellow-500"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">Stay updated with the latest events!</p>
        </div>
      </div>
    </div>
  );
}

export default EventsPage;
