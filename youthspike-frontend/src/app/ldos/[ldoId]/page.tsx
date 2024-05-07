'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import EventList from '@/components/event/EventList';
import DirectorDetail from '@/components/ldo/DirectorDetail';
import { GET_LDO } from '@/graphql/ldo';
import useResizeObserver from '@/hooks/useResizeObserver';
import { useAppDispatch } from '@/redux/hooks';
import { setScreenSize } from '@/redux/slices/elementSlice';
import { useQuery } from '@apollo/client';
import React, { useCallback, useState } from 'react';

function LDOSingle({ params }: { params: { ldoId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { data, error, loading } = useQuery(GET_LDO, { variables: { dId: params.ldoId } });


  // Resize window width 
  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);
  const mainEl = useResizeObserver(onResize);

  if (loading || isLoading) return <Loader />;

  const ldo = data?.getEventDirector?.data;

  return (
    <div className='container mx-auto px-2 min-h-screen' ref={mainEl}>
      {error && <Message error={error} />}
      {ldo && <DirectorDetail ldo={ldo} />}
      <br />
      {ldo && ldo.events && ldo.events.length > 0 && <EventList eventList={ldo.events} />}
    </div>
  )
}


export default LDOSingle;