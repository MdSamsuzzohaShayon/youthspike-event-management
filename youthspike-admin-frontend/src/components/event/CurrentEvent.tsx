import cld from '@/config/cloudinary.config';
import { IEventExpRel } from '@/types';
import { ISOToReadableDate } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';
import TextImg from '../elements/TextImg';

interface ICurrentEventProps {
    currEvent: IEventExpRel;
}

function CurrentEvent({ currEvent }: ICurrentEventProps) {
    return (
        <div className='event-detail w-full flex flex-col justify-center items-center gap-2'>
            {currEvent.logo
                ? <AdvancedImage cldImg={cld.image(currEvent.logo)} className="w-32 h-32 rounded-full object-center object-cover" alt="event-logo" />
                : <img src='/free-logo.png' className='w-32 h-32 rounded-full object-center object-cover' />}
            <h1>{currEvent.name}</h1>
            <div className="location flex justify-start items-center gap-2">
                <img src="/icons/location.svg" alt="location" className="icon svg-white w-8 h-8" />
                <p>{currEvent.location}</p>
            </div>
            <div className="clock flex justify-start items-center gap-2">
                <img src="/icons/clock.svg" alt="clock" className="icon svg-white w-6 h-6" />
                <p>{ISOToReadableDate(currEvent.startDate)} - {ISOToReadableDate(currEvent.endDate)}</p>
            </div>
        </div>
    )
}

export default CurrentEvent;