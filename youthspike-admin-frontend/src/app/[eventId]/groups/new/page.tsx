'use client';

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import { GET_EVENT_WITH_GROUP } from '@/graphql/group';
import { useLazyQuery } from '@apollo/client';
import { IError, ITeam } from '@/types';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface INetGroupProps {
  params: {
    eventId: string;
  };
}

function NewGroup({ params: { eventId } }: INetGroupProps) {
  const [getEvent, { data, loading, error }] = useLazyQuery(GET_EVENT_WITH_GROUP, {
    variables: { eventId },
    fetchPolicy: 'network-only',
  });

  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [divisions, setDivisions] = useState<string>('');

  const fetchEvent = async () => {
    const eventResponse = await getEvent();
    const success = eventResponse?.data?.getEvent?.success;
    if (success) {
      const { teams, divisions } = eventResponse.data.getEvent.data || {};
      
      setTeamList(teams || []);
      setDivisions(divisions || '');
    } else {
      setActErr({ message: 'Failed to fetch event details', success: false });
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  if (loading || isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-800 py-6 shadow-lg"
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Create a New Group</h1>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-10">
        {/* Error Message */}
        {actErr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <Message error={actErr} />
          </motion.div>
        )}

        {/* Group Add or Update Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <GroupAddOrUpdate
            update={false}
            prevGroup={null}
            setActErr={setActErr}
            setIsLoading={setIsLoading}
            divisions={divisions}
            teamList={teamList}
            eventId={eventId}
          />
        </motion.section>
      </main>
    </div>
  );
}

export default NewGroup;
