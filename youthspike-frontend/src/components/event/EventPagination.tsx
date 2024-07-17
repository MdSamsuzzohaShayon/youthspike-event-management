import { IEventWMatch } from '@/types';
import React from 'react';

interface IEventPagination {
  eventList: IEventWMatch[];
  EVENT_PAGE_LIMIT: number;
  listStart: number;
  setListStart: React.Dispatch<React.SetStateAction<number>>;
  setFilteredEventList: React.Dispatch<React.SetStateAction<IEventWMatch[]>>;
}

function EventPagination({ eventList, EVENT_PAGE_LIMIT, listStart, setListStart, setFilteredEventList }: IEventPagination) {
  const pages: number = Math.ceil(eventList.length / EVENT_PAGE_LIMIT);

  const handlePagination = (e: React.SyntheticEvent, index: number, isNext?: boolean) => {
    e.preventDefault();
    let newStart = index * EVENT_PAGE_LIMIT;
    if (isNext === false) {
      if (listStart !== 0) newStart = listStart - EVENT_PAGE_LIMIT;
    }
    if (isNext === true) {
      if (listStart + EVENT_PAGE_LIMIT < pages * EVENT_PAGE_LIMIT) {
        newStart = listStart + EVENT_PAGE_LIMIT;
      } else {
        newStart = (index - 1) * EVENT_PAGE_LIMIT;
      }
    }
    const newList = eventList.slice(newStart, newStart + EVENT_PAGE_LIMIT);
    setFilteredEventList(newList);
    setListStart(newStart);
  };

  if (eventList.length <= EVENT_PAGE_LIMIT) return null;

  const pageButtons: React.ReactNode[] = [];
  for (let i = 0; i < pages; i += 1) {
    if (i === 0) {
      pageButtons.push(
        <button key={`${i + 1}-previous`} className="btn-primary h-12" onClick={(e) => handlePagination(e, i, false)} type="button">
          Previous
        </button>,
      );
    }
    pageButtons.push(
      <button key={i + 1} className="btn-primary h-12 w-12" onClick={(e) => handlePagination(e, i)} type="button">
        {i + 1}
      </button>,
    );
    if (i === pages - 1) {
      pageButtons.push(
        <button key={`${i + 1}-next`} className="btn-primary h-12" onClick={(e) => handlePagination(e, i, true)} type="button">
          Next
        </button>,
      );
    }
  }

  return <div className="pagination flex justify-center items-center gap-x-1">{pageButtons}</div>;
}

export default EventPagination;
