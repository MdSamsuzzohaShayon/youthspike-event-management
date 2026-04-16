'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EEventPeriod, IEventWMatch, IGetEventsResponse } from '@/types/event';
import EventList from './EventList';
import SelectInput from '../elements/SelectInput';
import InputField from '../elements/InputField';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { setCookie } from '@/utils/cookie';
import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types';

interface IEventContainerProps {
  queryRef: QueryRef<{getEvents: IGetEventsResponse;}>
}

interface IFilterParams {
  date?: EEventPeriod;
  search?: string;
}


const dateOptions = [EEventPeriod.CURRENT, EEventPeriod.PAST].map((o) => ({ id: 1, text: o, value: o }));

function EventContainer({queryRef}: IEventContainerProps) {
  const { data } = useReadQuery(queryRef);
  const user = useUser();

  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {ldoIdUrl} = useLdoId();

  // Initialize filters and currentPage from query params
  const initialPeriod = (searchParams.get('period') as EEventPeriod) || EEventPeriod.CURRENT;
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [filterParams, setFilterParams] = useState<IFilterParams>({
    date: initialPeriod,
    search: initialSearch || undefined,
  });
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [events, setEvents] = useState<IEventWMatch[]>([]);

  // Update URL query params whenever filters or page change
  const updateQueryParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Filter params
    if (filterParams.date) params.set('period', filterParams.date);
    else params.delete('period');

    if (filterParams.search) params.set('search', filterParams.search);
    else params.delete('search');

    // Pagination
    params.set('page', currentPage.toString());

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filterParams, currentPage, router, pathname]); // searchParams

  useEffect(() => {
    updateQueryParams();
  }, [filterParams, currentPage, updateQueryParams]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterParams((prev) => ({ ...prev, search: e.target.value.trim() || undefined }));
    setCurrentPage(1); // Reset page when search changes
  }, []);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterParams((prev) => ({ ...prev, date: e.target.value as EEventPeriod }));
    setCurrentPage(1); // Reset page when period changes
  }, []);



  useEffect(()=>{
    const list = [];
    for (const event of (data?.getEvents?.data || [])) {

      // Only admin can bypass this
      if(event?.defaulted && user.info?.role !== UserRole.admin){
        setCookie("NEXT_PUBLIC_CURRENT_EVENT_ID", event._id, 7);
        // Redirect to this page
        return router.push(`/events/${event._id}/matches/${ldoIdUrl}`);
      }
      list.push(event);
    }
    
    setEvents(list);
  }, [data, router, ldoIdUrl, user]);

  return (
    <div className="event-wrapper w-full min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Logo Section */}
        <div className="logo-wrapper w-full flex items-center justify-center mt-8">
          <Image alt="American Spikers League" loading="lazy" width={200} height={200} decoding="async" className="w-32" style={{ color: 'transparent' }} src="/free-logo.png" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-center mt-8 text-yellow-logo bg-clip-text text-transparent">Events</h1>
        {/* Event main  */}
        {/* Search and Filter Section */}
        <div className="search-filter w-full max-w-2xl mx-auto mt-8 space-y-6 bg-gray-800 p-6 rounded-lg">
          <div className="input-group grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectInput
              handleSelect={handlePeriodChange}
              name="period"
              optionList={dateOptions}
              label="Event Date"
              defaultValue={filterParams.date}
            />
            <InputField
              type="text"
              handleInputChange={handleInputChange}
              name="search"
              label="Search events"
              defaultValue={filterParams.search || ''}
            />
          </div>
        </div>

        {/* Event List Section */}
        <EventList eventList={events} />


      </div>
    </div>
  );
}

export default EventContainer;
