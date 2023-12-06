'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import DirectorList from '@/components/ldo/DirectorList';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { GET_LDOS } from '@/graphql/director';
import { useQuery } from '@apollo/client';
import React, { useState } from 'react';

function DirectorPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /**
   * Show list of directors
   */
  const { data, loading, error } = useQuery(GET_LDOS);  

  if (loading || isLoading) return <Loader />;
  if (error) return <Message error={error} />
  return (
    <div className='container mx-auto px-2'>
      <h1>Directors (Only accessable by admin)</h1>
      <DirectorAdd setIsLoading={setIsLoading} update={false} />
      <DirectorList ldoList={data?.getEventDirectors?.data} />
    </div>
  )
}

export default DirectorPage;