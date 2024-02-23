import cld from '@/config/cloudinary.config';
import { IUser, IUserContext } from '@/types';
import { IEvent } from '@/types/event';
import { UserRole } from '@/types/user';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useState } from 'react';

interface IEventCardProps {
    event: IEvent;
    copyEvent: (e: React.SyntheticEvent, eventId: string) => void;
    user: IUserContext | null;
    directorId: string | null;
}

// Create an array of month names
const monthNames: string[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];


function EventCard({ event, copyEvent, user, directorId }: IEventCardProps) {

    const [actionOpen, setActionOpen] = useState<boolean>(false);

    const handleCopyEvent = (e: React.SyntheticEvent, eventId: string) => {
        e.preventDefault();
        setActionOpen(false);
        copyEvent(e, eventId);
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
        <div key={event._id} style={{ width: '48.5%' }} className="box mb-1 p-2 h-48 bg-gray-700 flex justify-around items-center flex-col gap-2 rounded-md relative">
            <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
                <li role="presentation" onClick={(e) => handleCopyEvent(e, event._id)}>Copy</li>
                <li> <Link href={makeSettingUrl()}>Edit</Link></li>
            </ul>
            <div className="w-full flex justify-end">
                <img src="/icons/dots-vertical.svg" alt="dot-vertical" role="presentation" onClick={handleOpenAction} className="w-4 svg-white" />
            </div>
            <Link href={`/${event._id}`}>
                <div className="img-wrapper w-full flex justify-center items-center">
                    {event.logo ? <AdvancedImage cldImg={cld.image(event.logo)} alt="logo" className="w-12" /> : <img src="/free-logo.svg" alt="logo" className="w-12" />}
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