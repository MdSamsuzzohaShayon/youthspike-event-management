/* eslint-disable no-unused-vars */

'use client';

import { useLazyQuery } from '@apollo/client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loader from '@/components/elements/Loader';
import EventDetail from '@/components/event/EventDetail';
import { GET_AN_EVENT } from '@/graphql/event';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch } from '@/redux/hooks';
import { setActErr } from '@/redux/slices/elementSlice';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import { isValidObjectId } from '@/utils/helper';
import { setEvent } from '@/utils/localStorage';

function EventSingle({ params }: { params: { eventId: string } }) {
  const user = useUser();
  const dispatch = useAppDispatch();
  const searchQuery = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Lazy query to fetch the event
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_AN_EVENT, {
    variables: { eventId: params.eventId },
    fetchPolicy: 'network-only',
    onError: (err) => {
      dispatch(
        setActErr({
          message: `Error fetching event: ${err.message}`,
          code: 500,
          success: false,
        })
      );
    },
  });

  // Fetch event data when eventId is valid
  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        setEvent(params.eventId); // Save the event ID to localStorage
        fetchEvent({ variables: { eventId: params.eventId } });
      } else {
        dispatch(
          setActErr({
            message: 'Invalid Event ID! Please check and try again.',
            code: 400,
            success: false,
          })
        );
      }
    }
  }, [dispatch, fetchEvent, params.eventId]);

  // Handle admin-specific logic for LDO_ID in the query parameters
  useEffect(() => {
    if (user && user.token && user.info?.role === UserRole.admin) {
      const ldoIdExist = searchQuery.get(LDO_ID);
      if (!ldoIdExist || ldoIdExist === '') {
        if (data?.getEvent?.data?.ldo?._id) {
          router.push(`${pathname}/?${LDO_ID}=${data.getEvent.data.ldo._id}`);
        }
      }
    }
  }, [data, user, searchQuery, router, pathname]);

  // Display loading state or error message if applicable
  if (loading || isLoading) return <Loader />;

  if (error) {
    return (
      <div className="container mx-auto px-2 min-h-screen">
        <p className="text-red-500 text-center">An error occurred: {error.message}</p>
      </div>
    );
  }

  // Handle case where no event data is returned
  const prevEvent = data?.getEvent?.data;
  
  
  if (!prevEvent) {
    return (
      <div className="container mx-auto px-2 min-h-screen">
        <p className="text-gray-500 text-center">No event found with this ID.</p>
      </div>
    );
  }

  // Render the event details
  return (
    <div className="container mx-auto px-2 min-h-screen">
      <EventDetail event={prevEvent} />
    </div>
  );
}

export default EventSingle;
