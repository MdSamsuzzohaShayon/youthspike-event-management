import { IEvent, IEventWMatch } from '@/types';
import React, { useEffect, useState } from 'react';
import { eventPeriods } from '@/utils/constant';
import { EEventPeriod } from '@/types/event';
import { validateMatchDatetime } from '@/utils/datetime';
import EventCard from './EventCard';
import EventPagination from './EventPagination';
import TextInput from '../elements/TextInput';
import SelectInput from '../elements/SelectInput';

const EVENT_PAGE_LIMIT = 10;

interface IFilterParams {
  date?: EEventPeriod;
  search?: string;
}

function EventList({ eventList }: { eventList: IEventWMatch[] }) {
  const [listStart, setListStart] = useState<number>(0);
  const [filterParams, setFilterParams] = useState<IFilterParams>({ date: EEventPeriod.CURRENT });
  const [cloneEventList, setCloneEventList] = useState<IEventWMatch[]>([...eventList]);
  const [filteredEventList, setFilteredEventList] = useState<IEventWMatch[]>([]);

  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.value && inputEl.value !== '') setFilterParams({ search: inputEl.value });
  };

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    // @ts-ignore
    setFilterParams({ date: inputEl.value });
  };

  const filterEvents = () => {
    const filteredList = [];
  
    for (let i = 0; i < cloneEventList.length; i += 1) {
      const currEvent = cloneEventList[i];
      let matchFound = false;
  
      // Check date filter
      if (filterParams.date) {
        if (currEvent.startDate && validateMatchDatetime(currEvent.startDate) === filterParams.date) {
          matchFound = true;
        } else if (currEvent.endDate && validateMatchDatetime(currEvent.endDate) === filterParams.date) {
          matchFound = true;
        } else if(filterParams.date){
          for (let j = 0; j < currEvent.matches.length; j += 1) {
            const currMatch = currEvent.matches[j];
            if (currMatch.date && validateMatchDatetime(currMatch.date) === filterParams.date) {
              matchFound = true;
              break;
            }
          }
        }
      }
  
      // Check search filter
      if (filterParams.search) {
        const searchText = filterParams.search.trim().toLowerCase();
        if (
          currEvent.name?.toLowerCase().includes(searchText) ||
          currEvent.description?.toLowerCase().includes(searchText)
        ) {
          matchFound = true;
        } else {
          matchFound = false;
        }
      }
  
      if (matchFound) {
        filteredList.push(currEvent);
      }
    }
  
    setFilteredEventList(filteredList);
  };
  

  useEffect(() => {
    filterEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, cloneEventList]);

  return (
    <div className="EventList ">
      <div className="search-filter w-full mb-8">
        <SelectInput
          name="period"
          optionList={eventPeriods.map((p) => ({ text: p, value: p }))}
          lblTxt="Date"
          rw="w-3/6"
          vertical
          defaultValue={EEventPeriod.CURRENT}
          handleSelect={handlePeriodChange}
        />
        <TextInput vertical name="search" handleInputChange={handleInputChange} />
      </div>

      <div className="w-full event-list flex flex-wrap gap-1 justify-start">
        {filteredEventList.length > 0 && filteredEventList.map((event: IEvent) => <EventCard key={event._id} event={event} />)}
      </div>
      <div className="psgination-wrapper w-full mt-4 ">
        <EventPagination EVENT_PAGE_LIMIT={EVENT_PAGE_LIMIT} listStart={listStart} eventList={filteredEventList} setListStart={setListStart} setFilteredEventList={setCloneEventList} />
      </div>
    </div>
  );
}

export default EventList;
