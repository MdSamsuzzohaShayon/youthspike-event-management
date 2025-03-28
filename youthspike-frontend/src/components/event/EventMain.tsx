/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeEvent } from '@/utils/localStorage';
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
  // ===== Hooks =====
  const dispatch = useDispatch();
  // const socket = useSocket();

  // ===== Local State =====
  const [filterParams, setFilterParams] = useState<IFilterParams>({ date: EEventPeriod.CURRENT });
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterParams((prev) => ({ ...prev, search: e.target.value.trim() || undefined }));
  }, []);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterParams((prev) => ({ ...prev, date: e.target.value as EEventPeriod }));
  }, []);

  useEffect(() => {
    removeEvent();
    // setFilteredEventList(events);
  }, [dispatch, events]);

  /*
  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    if (socket) {
      // const eventListener = new Event
    }
  }, [socket]);
  */

  const paginatedEvents = useMemo(() => {
    const newEventList = events.filter((currEvent) => {
      let matchFound = false;

      // Check date filter
      if (filterParams.date) {
        matchFound =
          (currEvent.startDate && validateMatchDatetime(currEvent.startDate) === filterParams.date) ||
          (currEvent.endDate && validateMatchDatetime(currEvent.endDate) === filterParams.date) ||
          currEvent.matches.some((match) => match.date && validateMatchDatetime(match.date) === filterParams.date);
      }

      // Check search filter
      if (filterParams.search) {
        const searchText = filterParams.search.toLowerCase();
        if (currEvent.name?.toLowerCase().includes(searchText) || currEvent.description?.toLowerCase().includes(searchText) || currEvent.location?.toLowerCase().includes(searchText)) {
          matchFound = true;
        } else {
          matchFound = false;
        }
      }

      return matchFound;
    });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pe = newEventList.slice(start, start + ITEMS_PER_PAGE);

    return pe;
  }, [currentPage, events, filterParams]);

  return (
    <React.Fragment>
      {/* Search and Filter Section - bg-gradient-to-tl from-gray-900 via-gray-800 to-gray-900 */}
      <div className="search-filter w-full max-w-2xl mx-auto mt-8 space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="input-group grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectInput handleSelect={handlePeriodChange} name="period" optionList={dateOptions} label="Event Date" defaultValue={EEventPeriod.CURRENT} />
          <InputField type="text" handleInputChange={handleInputChange} name="search" label="search events" />
        </div>
      </div>

      {/* Event List Section */}
      <EventList eventList={paginatedEvents} />

      <div className="w-full mt-8">
        <Pagination ITEMS_PER_PAGE={20} currentPage={currentPage} itemList={paginatedEvents} setCurrentPage={setCurrentPage} />
      </div>
    </React.Fragment>
  );
}

export default EventMain;
