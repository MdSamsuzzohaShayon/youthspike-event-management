'use client'

import Loader from '@/components/elements/Loader';
import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import { GET_A_GROUP } from '@/graphql/group';
import { useError } from '@/lib/ErrorProvider';
import { IGroupAdd, IGroupRes, ITeam } from '@/types';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';
import { useLazyQuery } from '@apollo/client/react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface IUpdatePageProps {
  params: {
    eventId: string;
    groupId: string;
  }
}

function UpdateGroupPage({ params: { eventId, groupId } }: IUpdatePageProps) {
  const [getGroup, { loading }] = useLazyQuery<{getGroup: IGroupRes}>(GET_A_GROUP, {
    // variables: { groupId },
    fetchPolicy: 'network-only',
  });

    const {setActErr} = useError();
  

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groupState, setGroupState] = useState<IGroupAdd | null>(null);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [divisions, setDivisions] = useState<string>('');

  const fetchGroup = async () => {
    const groupResponse = await getGroup({variables: {groupId}});
    const success = await handleResponseCheck(groupResponse?.data?.getGroup, setActErr );
    if (success) {
      const groupExist = groupResponse?.data?.getGroup?.data || null;
      // @ts-ignore
      if (groupExist) setGroupState({...groupExist} as IGroupAdd);

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
