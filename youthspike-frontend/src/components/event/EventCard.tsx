import cld from '@/config/cloudinary.config';
import { useAppSelector } from '@/redux/hooks';
import { IEvent } from '@/types/event';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { cardAnimate } from '@/utils/animation';
import { imgW } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';

interface IEventCardProps {
  event: IEvent;
}

const { initial, animate, exit, transition } = cardAnimate;

// Create an array of month names
const monthNames: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function EventCard({ event }: IEventCardProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();

  const screenWidth = useAppSelector((state) => state.elements.screenWidth);

  console.log(user.info?.role === UserRole.admin || user.info?.role === UserRole.director);

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      key={event._id}
      style={{ width: screenWidth <= 768 ? '48.5%' : '24.6%' }}
      className="box mb-1 p-2 h-48 bg-gray-700 flex justify-around items-center flex-col gap-2 rounded-md"
    >
      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
        <Link href={`${ADMIN_FRONTEND_URL}/${event._id}/settings/${ldoIdUrl}`} className="w-full flex items-center justify-end">
          <Image src="/icons/edit.svg" height={imgW.logo} width={imgW.logo} alt="Exit Button" className="svg-white" />
        </Link>
      )}
      <Link href={`/events/${event._id}/${ldoIdUrl}`}>
        <div className="img-wrapper w-full flex justify-center items-center">
          {event.logo ? <AdvancedImage className="w-12" cldImg={cld.image(event.logo)} alt={event.name} /> : <Image height={20} width={20} src="/free-logo.png" alt="plus" className="w-12" />}
        </div>

        <div className="text-box text-center">
          <h3 className="text-lg font-bold mb-0">{event.name}</h3>
          <p style={{ fontSize: '0.7rem' }}>
            {`${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `} -{' '}
            {`${monthNames[new Date(event.endDate).getMonth()]} ${new Date(event.endDate).getDate()}, ${new Date(event.endDate).getFullYear()} `}
          </p>
          {event.description && <p>{event.description}</p>}
        </div>
      </Link>
    </motion.div>
  );
}

export default EventCard;
