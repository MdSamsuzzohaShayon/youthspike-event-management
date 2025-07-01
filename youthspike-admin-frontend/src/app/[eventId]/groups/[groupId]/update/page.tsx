'use client'

import Loader from '@/components/elements/Loader';
import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import { GET_A_GROUP, GET_EVENT_WITH_GROUP } from '@/graphql/group';
import { useError } from '@/lib/ErrorProvider';
import { IError, IGroupAdd, IGroupExpRel, ITeam } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { useLazyQuery } from '@apollo/client';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

interface IUpdatePageProps {
  params: {
    eventId: string;
    groupId: string;
  }
}

function UpdateGroupPage({ params: { eventId, groupId } }: IUpdatePageProps) {
  const [getGroup, { data, loading, error }] = useLazyQuery(GET_A_GROUP, {
    variables: { groupId },
    fetchPolicy: 'network-only',
  });

    const {setActErr} = useError();
  

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groupState, setGroupState] = useState<IGroupAdd | null>(null);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [divisions, setDivisions] = useState<string>('');

  const fetchGroup = async () => {
    const groupResponse = await getGroup();
    const success = await handleResponse({ response: groupResponse?.data?.getGroup, setActErr });
    if (success) {
      const groupExist = groupResponse.data.getGroup.data || null;
      if (groupExist) setGroupState(groupExist);

      setTeamList(groupExist?.teams || []);
      setDivisions(groupExist?.event?.divisions || '');
    } else {
      setActErr({ message: 'Failed to fetch event details', success: false });
    }
  };


  useEffect(() => {
    fetchGroup();
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
          <h1 className="text-3xl md:text-4xl font-bold">Update Group</h1>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-10">
        {/* Group Add or Update Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <GroupAddOrUpdate
            update={true}
            setIsLoading={setIsLoading}
            prevGroup={groupState}
            divisions={divisions}
            teamList={teamList}
            eventId={eventId}
          />
        </motion.section>
      </main>
    </div>
  );
}

export default UpdateGroupPage;
