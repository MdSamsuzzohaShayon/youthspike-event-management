import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import React from 'react';
import { getEventWithGroups } from '@/app/_requests/groups';
import { notFound } from 'next/navigation';
import { IEventPageProps } from '@/types';


async function NewGroup({ params: { eventId } }: IEventPageProps) {
  const groupDetail = await getEventWithGroups(eventId);

  if (!groupDetail) {
    notFound();
  }


  const divisions = groupDetail?.divisions || '';
  const teams = groupDetail?.teams || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="bg-gray-800 py-6 shadow-lg"
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Create a New Group</h1>
        </div>
      </header>

      <main className="container mt-6 p-4 bg-gray-gradient rounded-xl shadow-lg max-w-5xl mx-auto">

        {/* Group Add or Update Form */}
        <section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <GroupAddOrUpdate
            update={false}
            prevGroup={null}
            divisions={divisions}
            teamList={teams}
            eventId={eventId}
          />
        </section>
      </main>
    </div>
  );
}

export default NewGroup;
