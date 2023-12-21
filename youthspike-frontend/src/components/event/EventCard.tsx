import { IEvent } from '@/types/event';
import Link from 'next/link';
import React, { useState } from 'react';

interface IEventCardProps {
    event: IEvent;
}

// Create an array of month names
const monthNames: string[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


function EventCard({ event }: IEventCardProps) {

    return (
        <div key={event._id} style={{ width: '48.5%' }} className="box mb-1 p-2 h-48 bg-gray-700 flex justify-around items-center flex-col gap-2 rounded-md">
            <Link href={`/events/${event._id}`}>
                <div className="img-wrapper w-full flex justify-center items-center">
                    <img src="/free-logo.svg" alt="plus" className="w-12" />
                </div>
                <div className="text-box text-center">
                    <h3 className='text-lg font-bold mb-0'>{event.name}</h3>
                    <p style={{ fontSize: '0.7rem' }} >
                        {`${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `} - {`${monthNames[new Date(event.endDate).getMonth()]} ${new Date(event.endDate).getDate()}, ${new Date(event.endDate).getFullYear()} `}</p>
                    <p>Idaho, Fall, ID</p>
                </div>
            </Link>
        </div>
    )
}

export default EventCard