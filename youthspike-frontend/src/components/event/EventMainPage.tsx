'use client'

import { GET_EVENTS } from '@/graphql/event';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import Loader from '../elements/Loader';
import EventList from './EventList';
import { useDispatch } from 'react-redux';
import { setEventList } from '@/redux/slices/eventSlice';
import { useAppSelector } from '@/redux/hooks';
import { IEvent } from '@/types';
import EventPagination from './EventPagination';

function EventMainPage() {

    const EVENT_PAGE_LIMIT = 10;

    // ===== Hooks =====
    const dispatch = useDispatch();

    // ===== GraphQL =====
    const [getEvents, { loading, refetch }] = useLazyQuery(GET_EVENTS, { fetchPolicy: "network-only" });

    // ===== Redux =====
    const { eventList } = useAppSelector((state) => state.events);

    // ===== Local State =====
    const [filteredEventList, setFilteredEventList] = useState<IEvent[]>([]);
    const [listStart, setListStart] = useState<number>(0);




    /*
    const dummyEvents = (): IEvent[] => {
        const el: IEvent[] = [];
        // Create dummy list
        for (let i = 0; i < EVENT_PAGE_LIMIT * 6; i++) {
            const eventElement: IEvent = {
                _id: crypto.randomUUID(),
                name: `Event ${i + 1}`,
                active: true,
                autoAssign: true,
                autoAssignLogic: '',
                coachPassword: '1234',
                divisions: 'd1, d2, d3',
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                playerLimit: 1,
                sponsors: [],
                nets: 1,
                rounds: 1,
                netVariance: 1,
                homeTeam: 'string',
                rosterLock: 'string',
                timeout: 1,
                location: 'string',
            };
            el.push(eventElement);
        }
        return el;
    }
    */

    useEffect(() => {
        (async () => {
            const res = await getEvents();
            if (res?.data?.getEvents?.data) {
                // dispatch(setEventList(res.data.getEvents.data));

                // const dummyEventList = dummyEvents();
                dispatch(setEventList(res.data.getEvents.data));
                setFilteredEventList(res.data.getEvents.data.slice(listStart, EVENT_PAGE_LIMIT));
            }
        })()
    }, []);


    if (loading) return <Loader />

    return (
        <div className='container mx-auto px-2 min-h-screen'>
            <h1>Events</h1>
            <div className="event-list mt-4">
                {filteredEventList && filteredEventList.length > 0 && <EventList eventList={filteredEventList} />}
            </div>

            <div className="psgination-wrapper w-full mt-4 ">
                <EventPagination EVENT_PAGE_LIMIT={EVENT_PAGE_LIMIT} listStart={listStart} eventList={eventList} setListStart={setListStart} setFilteredEventList={setFilteredEventList} />
            </div>
        </div>
    )
}

export default EventMainPage;