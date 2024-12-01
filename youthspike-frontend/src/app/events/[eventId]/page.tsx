/* eslint-disable no-unused-vars */

'use client';

import Loader from '@/components/elements/Loader';
import EventDetail from '@/components/event/EventDetail';
import { GET_AN_EVENT } from '@/graphql/event';
import { useUser } from '@/lib/UserProvider';
import { IError } from '@/types';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import { isValidObjectId } from '@/utils/helper';
import { setEvent } from '@/utils/localStorage';
import { useLazyQuery } from '@apollo/client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function EventSingle({ params }: { params: { eventId: string } }) {
  const user = useUser();
  const searchQuery = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Read query from cache or fetch data from server
   */
  const [fetchEvent, { data, loading }] = useLazyQuery(GET_AN_EVENT, { variables: { eventId: params.eventId }, fetchPolicy: 'network-only' });

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        // Set event Id to local storage
        setEvent(params.eventId);
        fetchEvent({ variables: { eventId: params.eventId } });
      } else {
        setActErr({ message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [fetchEvent, params.eventId]);

  useEffect(() => {
    if (user && user?.token && user?.info?.role === UserRole.admin) {
      const ldoIdExist = searchQuery.get(LDO_ID);
      if (!ldoIdExist || ldoIdExist === '') {
        if (data?.getEvent?.data?.ldo?._id) {
          router.push(`${pathname}/?${LDO_ID}=${data?.getEvent?.data?.ldo?._id}`);
        }
      }
    }
  }, [data, user, searchQuery, router, pathname]);

  if (loading || isLoading) return <Loader />;

  const prevEvent = data?.getEvent?.data;

  return <div className="container mx-auto px-2 min-h-screen">{prevEvent && <EventDetail event={prevEvent} />}</div>;
}

export default EventSingle;
