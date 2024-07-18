import cld from '@/config/cloudinary.config';
import { IEventExpRel } from '@/types';
import { ISOToReadableDate } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { headingAnimate, logoAnimate } from '@/utils/animation';


const {initial: lInitial, animate: lAnimate, exit: lExit, transition: lTransition} = logoAnimate;
const {initial: hInitial, animate: hAnimate, exit: hExit, transition: hTransition} = headingAnimate;

interface ICurrentEventProps {
    currEvent: IEventExpRel;
}

function CurrentEvent({ currEvent }: ICurrentEventProps) {
    return (
        <div className='event-detail w-full flex flex-col justify-center items-center gap-2'>
            <motion.div initial={lInitial} animate={lAnimate} exit={lExit} transition={{...lTransition, delay: 1}} className="logo w-full flex justify-center items-center">
                {currEvent.logo
                    ? <AdvancedImage cldImg={cld.image(currEvent.logo)} className="w-32 h-32 rounded-full object-center object-cover" alt="event-logo" />
                    : <Image width={100} height={100} alt='free-logo' src='/free-logo.png' className='w-32 h-32 rounded-full object-center object-cover' />}
            </motion.div>
            <motion.h1 initial={hInitial} animate={hAnimate} exit={hExit} transition={{...hTransition, delay: 0.8}} >{currEvent.name}</motion.h1>
            <motion.div initial={hInitial} animate={hAnimate} exit={hExit} transition={{...hTransition, delay: 0.6}} className="location flex justify-start items-center gap-2">
                <Image width={8} height={8} src="/icons/location.svg" alt="location" className="icon svg-white w-8 h-8" />
                <p>{currEvent.description}</p>
            </motion.div>
            <motion.div initial={hInitial} animate={hAnimate} exit={hExit} transition={{...hTransition, delay: 0.4}} className="clock flex justify-start items-center gap-2">
                <Image width={8} height={8} alt='clock-logo' src="/icons/clock.svg" className="icon svg-white w-6 h-6" />
                <p>{ISOToReadableDate(currEvent.startDate)} - {ISOToReadableDate(currEvent.endDate)}</p>
            </motion.div>
        </div>
    )
}

export default CurrentEvent;