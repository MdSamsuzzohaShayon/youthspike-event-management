'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import DirectorList from '@/components/ldo/DirectorList';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { GET_LDOS } from '@/graphql/director';
import { useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { IError } from '@/types';

function DirectorPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addNewDirector, setAddNetDirector] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  /**
   * Show list of directors
   */
  const { data, loading, error } = useQuery(GET_LDOS);
  
  if (loading || isLoading) return <Loader />;

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='my-4 text-center'>Directors</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {addNewDirector ? <DirectorAdd setIsLoading={setIsLoading} update={false} setActErr={setActErr} setAddNetDirector={setAddNetDirector} /> : (<>
        <DirectorList ldoList={data?.getEventDirectors?.data} />
        <button className="btn-info mt-4" type='button' onClick={() => setAddNetDirector(true)}>Add New</button>
      </>)}
    </div>
  )
}

export default DirectorPage;