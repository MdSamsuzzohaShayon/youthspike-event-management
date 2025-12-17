/* eslint-disable no-unused-vars */
import { IEvent } from '@/types/event';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import useClickOutside from '../../hooks/useClickOutside';
import { useLdoId } from '@/lib/LdoProvider';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';

interface IEventCardProps {
  event: IEvent;
  copyEvent: (e: React.SyntheticEvent, eventId: string) => void;
  deleteEvent: (e: React.SyntheticEvent, eventId: string) => void;
  handleExportPlayers: (e: React.SyntheticEvent, eventId: string) => void;
  sendCredentials: (eventId: string) => void;
}

// Create an array of month names
const monthNames: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function EventCard({ event, copyEvent, deleteEvent, sendCredentials, handleExportPlayers }: IEventCardProps) {
  const { ldoIdUrl } = useLdoId();

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const ulEl = useRef<HTMLElement | null>(null);

  useClickOutside(ulEl, () => {
    setActionOpen(false);
  });

  const handleCopyEvent = (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    setActionOpen(false);
    copyEvent(e, eventId);
  };

  const handleDeleteEvent = (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    setActionOpen(false);
    deleteEvent(e, eventId);
  };

  const handleSendCredential = (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    // Send captain credentials to the captain and co captain credentials to co captain
    sendCredentials(eventId);
  };

  const handleOpenAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActionOpen((prevState) => !prevState);
  };

  return (
    <div key={event._id} className="event-card mb-1 p-2 bg-gray-800 flex justify-around items-center flex-col gap-2 rounded-md relative">
      {actionOpen && (
        <AnimatePresence>
          <motion.ul
            className="absolute z-10 right-6 top-4 md:right-6 md:top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <li role="presentation" onClick={(e) => handleCopyEvent(e, event._id)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <span>
                <Image width={20} height={20} src="/icons/copy.svg" alt="Edit-icon" className="svg-white" />
              </span>
              Copy
            </li>
            <li role="presentation" onClick={(e) => handleSendCredential(e, event._id)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <span>
                <Image width={20} height={20} src="/icons/send-email.svg" alt="Edit-icon" className="svg-white" />
              </span>{' '}
              {event.sendCredentials ? 'Resend Credential' : 'Send Credentials'}
            </li>
            <li>
              <Link href={`/${event._id}/settings/${ldoIdUrl}`} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <span>
                  <Image width={20} height={20} src="/icons/edit.svg" alt="Edit-icon" className="svg-white" />
                </span>
                Edit
              </Link>
            </li>
            <li>
              <button className="btn-success" type='button' onClick={(e) => handleExportPlayers(e, event._id)}>
                <span>
                  <Image width={20} height={20} src="/icons/edit.svg" alt="Edit-icon" className="svg-white" />
                </span>
                Export Players
              </button>
            </li>
            {/* <li role="presentation" onClick={(e) => handleDeleteEvent(e, event._id)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <span>
                <Image width={20} height={20} src="/icons/delete.svg" alt="Edit-icon" className="svg-white" />
              </span>
              Delete
            </li> */}
          </motion.ul>
        </AnimatePresence>
      )}

      <div className="w-full flex justify-end">
        <img src="/icons/dots-vertical.svg" alt="dot-vertical" role="presentation" onClick={handleOpenAction} className="w-4 svg-white" />
      </div>
      <Link href={`/${event._id}/${ldoIdUrl}`}>
        <div className="img-wrapper w-full flex justify-center items-center">
          {event.logo ? (
            <CldImage crop="fit" width={100} height={100} src={event.logo} alt="logo" className="w-12 h-12 object-cover object-center" />
          ) : (
            <Image src="/free-logo.png" width={20} height={20} alt="free-logo" className="w-12 h-12" />
          )}
        </div>
        <div className="text-box text-center">
          <h3 className="text-lg font-bold mb-0">{event.name}</h3>
          <p style={{ fontSize: '0.7rem' }}>
            {`${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `} -{' '}
            {`${monthNames[new Date(event.endDate).getMonth()]} ${new Date(event.endDate).getDate()}, ${new Date(event.endDate).getFullYear()} `}
          </p>
          <p>{event.description}</p>
          <p>{event.location}</p>
        </div>
      </Link>
    </div>
  );
}

export default EventCard;
