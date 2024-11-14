'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { GET_LDO, GET_LDOS } from '@/graphql/director';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { IError } from '@/types';

function LDOSingle({ params }: { params: { ldoId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data, error, loading, refetch } = useQuery(GET_LDO, { variables: { dId: params.ldoId } });
  const [actErr, setActErr] = useState<IError | null>(null);

  const refetchFunc=async ()=>{
    await refetch();
  }

  if (loading || isLoading) return <Loader />;
  const prevLdo = data?.getEventDirector?.data;
  
  

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <DirectorAdd setIsLoading={setIsLoading} update prevLdo={prevLdo} setActErr={setActErr} ldoId={params.ldoId} refetchFunc={refetchFunc} />
    </div>
  )
}


export default LDOSingle;