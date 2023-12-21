'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import EventCard from '@/components/event/EventCard';
import EventList from '@/components/event/EventList';
import DirectorDetail from '@/components/ldo/DirectorDetail';
import { GET_LDO } from '@/graphql/ldo';
import { IEvent } from '@/types';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

function LDOSingle({ params }: { params: { ldoId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data, error, loading } = useQuery(GET_LDO, { variables: { dId: params.ldoId } })

  if (loading || isLoading) return <Loader />;

  const ldo = data?.getEventDirector?.data;

  return (
    <div className='container mx-auto px-2'>
      {error && <Message error={error} />}
      {ldo && <DirectorDetail ldo={ldo} />}
      <br />
      {ldo && ldo.events && ldo.events.length > 0 && <EventList eventList={ldo.events} />}
    </div>
  )
}


export default LDOSingle;