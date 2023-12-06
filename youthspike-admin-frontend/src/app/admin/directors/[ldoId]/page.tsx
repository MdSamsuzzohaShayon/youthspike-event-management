'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { GET_LDO, GET_LDOS } from '@/graphql/director';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

function LDOSingle({ params }: { params: { ldoId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data, error, loading } = useQuery(GET_LDO, {variables: {dId: params.ldoId}})

  if (loading || isLoading) return <Loader />;


  return (
    <div className='container mx-auto px-2'>
      <p>Fetch director by Id</p>
      <p>Get ldo from cache from cache and use that as default value in director add</p>
      <h2>Update Director</h2>
      {error && <Message error={error} />}
      <DirectorAdd setIsLoading={setIsLoading} update prevLdo={data?.getLeagueDirector?.data} />
    </div>
  )
}


export default LDOSingle;