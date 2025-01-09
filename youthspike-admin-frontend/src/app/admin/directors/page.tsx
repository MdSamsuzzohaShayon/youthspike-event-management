'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import DirectorList from '@/components/ldo/DirectorList';
import Loader from '@/components/elements/Loader';
import { GET_LDOS } from '@/graphql/director';
import { useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

function DirectorPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addNewDirector, setAddNetDirector] = useState<boolean>(false);
  /**
   * Show list of directors
   */
  const { data, loading, error, refetch } = useQuery(GET_LDOS);

  const referchFunc=async ()=>{
    await refetch();
  }
  
  if (loading || isLoading) return <Loader />;
  if(error){
    console.log(error);
  }

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='my-4 text-center'>Directors</h1>
      {addNewDirector 
      ? <DirectorAdd setIsLoading={setIsLoading} update={false} setAddNetDirector={setAddNetDirector} refetchFunc={referchFunc} /> 
      : (<React.Fragment>
        <DirectorList ldoList={data?.getEventDirectors?.data} setIsLoading={setIsLoading} referchFunc={referchFunc} />
        <button className="btn-info mt-4" type='button' onClick={() => setAddNetDirector(true)}>Add New</button>
      </React.Fragment>)}
    </div>
  )
}

export default DirectorPage;