import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import React from 'react';
import { getEventWithGroups } from '@/app/_requests/groups';
import { notFound } from 'next/navigation';
import { TParams } from '@/types';


interface INewGroupProps{
  params: TParams;
}

async function NewGroup({ params }: INewGroupProps) {
  const pathParams = await params;

  const groupDetail = await getEventWithGroups(pathParams.eventId);

  if (!groupDetail) {
    notFound();
  }


  const divisions = groupDetail?.divisions || '';
  const teams = groupDetail?.teams || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="py-6 "
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-yellow-logo text-3xl md:text-4xl font-bold">Create a New Group</h1>
        </div>
      </header>

      <main className="container mt-6 p-4 mx-auto">

        {/* Group Add or Update Form */}
        <section
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <GroupAddOrUpdate
            update={false}
            prevGroup={null}
            divisions={divisions}
            teamList={teams}
            eventId={pathParams.eventId}
          />
        </section>
      </main>
    </div>
  );
}

export default NewGroup;
