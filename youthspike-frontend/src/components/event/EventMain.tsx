'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { IEventWMatch } from '@/types';
import { EEventPeriod } from '@/types/event';
import { validateMatchDatetime } from '@/utils/datetime';
import EventList from './EventList';
import Pagination from '../elements/Pagination';
import SelectInput from '../elements/SelectInput';
import InputField from '../elements/InputField';

interface IEventMainProps {
  events: IEventWMatch[];
}

interface IFilterParams {
  date?: EEventPeriod;
  search?: string;
}

const ITEMS_PER_PAGE = 20;

const dateOptions = [EEventPeriod.CURRENT, EEventPeriod.PAST].map((o) => ({ id: 1, text: o, value: o }));

function EventMain({ events }: IEventMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters and currentPage from query params
  const initialPeriod = (searchParams.get('period') as EEventPeriod) || EEventPeriod.CURRENT;
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [filterParams, setFilterParams] = useState<IFilterParams>({
    date: initialPeriod,
    search: initialSearch || undefined,
  });
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

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
  }, [filterParams, currentPage, router, pathname, searchParams]);

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

  const paginatedEvents = useMemo(() => {
    const filtered = events.filter((currEvent) => {
      let matchFound = false;

      // Date filter
      if (filterParams.date) {
        matchFound =
          (currEvent.startDate && validateMatchDatetime(currEvent.startDate) === filterParams.date) ||
          (currEvent.endDate && validateMatchDatetime(currEvent.endDate) === filterParams.date) ||
          currEvent.matches.some(
            (match) => typeof match === 'object' && match.date && validateMatchDatetime(match.date) === filterParams.date
          );
      }

      // Search filter
      if (filterParams.search) {
        const searchText = filterParams.search.toLowerCase();
        if (
          currEvent.name?.toLowerCase().includes(searchText) ||
          currEvent.description?.toLowerCase().includes(searchText) ||
          currEvent.location?.toLowerCase().includes(searchText)
        ) {
          matchFound = true;
        } else {
          matchFound = false;
        }
      }

      return matchFound;
    });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, events, filterParams]);

  return (
    <React.Fragment>
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
      <EventList eventList={paginatedEvents} />

      <div className="w-full mt-8">
        <Pagination
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          currentPage={currentPage}
          itemList={paginatedEvents}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </React.Fragment>
  );
}

export default EventMain;
