import cld from '@/config/cloudinary.config';
import { IEvent, IUserContext } from '@/types';
import { ISOToReadableDate } from '@/utils/helper';
import { AdvancedImage } from '@cloudinary/react';
import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';

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
  user?: IUserContext | null;
}

function CurrentEvent({ currEvent }: ICurrentEventProps) {
  const user = useUser();

  const displayLogo: React.ReactNode = useMemo(() => {
    let logoEl = <Image
      width={128}
      height={128}
      alt="default-logo"
      src="/free-logo.png"
      className="w-32 h-32 rounded-full object-center object-cover"
    />;
    if (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) {
      if (user?.info?.teamLogo) {
        logoEl = <AdvancedImage
          cldImg={cld.image(user.info.teamLogo)}
          className="w-32 h-32 rounded-full object-center object-cover"
          alt="event-logo"
        />
      }
    } else if (user.info?.role === UserRole.admin || user.info?.role === UserRole.director) {
      if (currEvent?.logo) {
        logoEl = <AdvancedImage
          cldImg={cld.image(currEvent.logo)}
          className="w-32 h-32 rounded-full object-center object-cover"
          alt="event-logo"
        />
      }
    }
    return <React.Fragment>{logoEl}</React.Fragment>;
  }, [user, currEvent]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6 }}
      className="event-detail w-full flex flex-col justify-center items-center gap-6"
    >
      {/* Event Logo */}
      <motion.div
        variants={logoVariants}
        transition={{ duration: 0.8 }}
        className="logo flex justify-center items-center"
      >
        {displayLogo}
      </motion.div>
      {/* Event Name */}
      <motion.h1
        variants={textVariants}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-3xl font-bold text-white text-center"
      >
        {currEvent.name}
      </motion.h1>
      {(user && user.info?.team) && <div className="team-name text-center mt-4">
         <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>
      </div>
      }

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
        <p>{currEvent.location}</p>
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




