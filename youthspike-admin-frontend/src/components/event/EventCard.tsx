import cld from '@/config/cloudinary.config';
import { IUser, IUserContext } from '@/types';
import { IEvent } from '@/types/event';
import { UserRole } from '@/types/user';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import useClickOutside from '../../../hooks/useClickOutside';
import TextImg from '../elements/TextImg';

interface IEventCardProps {
    event: IEvent;
    copyEvent: (e: React.SyntheticEvent, eventId: string) => void;
    deleteEvent: (e: React.SyntheticEvent, eventId: string) => void;
    user: IUserContext | null;
    directorId: string | null;
}

// Create an array of month names
const monthNames: string[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


function EventCard({ event, copyEvent, deleteEvent, user, directorId }: IEventCardProps) {

    const [actionOpen, setActionOpen] = useState<boolean>(false);
    const ulEl = useRef<HTMLUListElement | null>(null);

    useClickOutside(ulEl, ()=>{
        setActionOpen(false);
    });

    const handleCopyEvent = (e: React.SyntheticEvent, eventId: string) => {
        e.preventDefault();
        setActionOpen(false);
        copyEvent(e, eventId);
    }

    const handleDeleteEvent = (e: React.SyntheticEvent, eventId: string) => {
        e.preventDefault();
        setActionOpen(false);
        deleteEvent(e, eventId);
    }

    const handleOpenAction = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setActionOpen(prevState => !prevState);
    }

    const makeSettingUrl=()=>{
        let newUrl = `/${event._id}/settings`;
        if(user && user.info && user.info.role === UserRole.admin) newUrl += `/?directorId=${directorId}`
        return newUrl;
    }

    return (
        <div key={event._id} className="event-card mb-1 p-2 bg-gray-700 flex justify-around items-center flex-col gap-2 rounded-md relative">
            <ul ref={ulEl} className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
                <li role="presentation" onClick={(e) => handleCopyEvent(e, event._id)} className='cursor-pointer'>Copy</li>
                <li> <Link href={makeSettingUrl()} className='cursor-pointer' >Edit</Link></li>
                <li role="presentation" onClick={(e) => handleDeleteEvent(e, event._id)} className='cursor-pointer'>Delete</li>
            </ul>
            <div className="w-full flex justify-end">
                <img src="/icons/dots-vertical.svg" alt="dot-vertical" role="presentation" onClick={handleOpenAction} className="w-4 svg-white" />
            </div>
            <Link href={`/${event._id}`}>
                <div className="img-wrapper w-full flex justify-center items-center">
                    {event.logo ? <AdvancedImage cldImg={cld.image(event.logo)} alt="logo" className="w-12" /> : <TextImg className='w-12 h-12' fullText={event.name}  />}
                </div>
                <div className="text-box text-center">
                    <h3 className='text-lg font-bold mb-0'>{event.name}</h3>
                    <p style={{ fontSize: '0.7rem' }} >
                        {`${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `} - {`${monthNames[new Date(event.endDate).getMonth()]} ${new Date(event.endDate).getDate()}, ${new Date(event.endDate).getFullYear()} `}</p>
                    <p>{event.location}</p>
                </div>
            </Link>
        </div>
    )
}

export default EventCard