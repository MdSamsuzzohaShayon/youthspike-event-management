import cld from '@/config/cloudinary.config';
import { IEvent } from '@/types';
import { ISOToReadableDate } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const logoVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ICurrentEventProps {
  currEvent: IEvent;
}

function CurrentEvent({ currEvent }: ICurrentEventProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6 }}
      className="event-detail w-full flex flex-col justify-center items-center gap-6 bg-gray-800 p-8 rounded-lg shadow-lg"
    >
      {/* Event Logo */}
      <motion.div
        variants={logoVariants}
        transition={{ duration: 0.8 }}
        className="logo flex justify-center items-center"
      >
        {currEvent.logo ? (
          <AdvancedImage
            cldImg={cld.image(currEvent.logo)}
            className="w-32 h-32 rounded-full object-center object-cover"
            alt="event-logo"
          />
        ) : (
          <Image
            width={128}
            height={128}
            alt="default-logo"
            src="/free-logo.png"
            className="w-32 h-32 rounded-full object-center object-cover"
          />
        )}
      </motion.div>

      {/* Event Name */}
      <motion.h1
        variants={textVariants}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-3xl font-bold text-white text-center"
      >
        {currEvent.name}
      </motion.h1>

      {/* Event Location */}
      <motion.div
        variants={textVariants}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="location flex items-center gap-3 text-gray-300 text-sm md:text-base"
      >
        <Image
          width={24}
          height={24}
          src="/icons/location.svg"
          alt="location-icon"
          className="icon w-6 h-6 svg-white"
        />
        <p>{currEvent.description}</p>
      </motion.div>

      {/* Event Timing */}
      <motion.div
        variants={textVariants}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="clock flex items-center gap-3 text-gray-300 text-sm md:text-base"
      >
        <Image
          width={24}
          height={24}
          src="/icons/clock.svg"
          alt="clock-icon"
          className="icon w-6 h-6 svg-white"
        />
        <p>
          {ISOToReadableDate(currEvent.startDate)} -{' '}
          {ISOToReadableDate(currEvent.endDate)}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default CurrentEvent;
