/* eslint-disable no-unused-vars */
import { IEvent } from '@/types/event';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import useClickOutside from '@/hooks/useClickOutside';
import { useLdoId } from '@/lib/LdoProvider';
import { monthNamesShort } from '@/utils/datetime';

interface EventCardProps {
  event: IEvent;
  onCopy: (e: React.SyntheticEvent, eventId: string) => void;
  onDelete: (e: React.SyntheticEvent, eventId: string) => void;
  onExportPlayers: (e: React.SyntheticEvent, eventId: string) => void;
  onSendCredentials: (eventId: string) => void;
}

/* -------------------------------------------------- */
/* ------------------ Sub Components ---------------- */
/* -------------------------------------------------- */

interface ActionMenuItemProps {
  icon: string;
  label: string;
  onClick: (e: React.SyntheticEvent) => void;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 
               hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg 
               transition-all duration-200 group/item"
  >
    <Image
      width={20}
      height={20}
      src={icon}
      alt={`${label}-icon`}
      className="opacity-50 group-hover/item:opacity-100 svg-white"
    />
    {label}
  </button>
);

interface EventImageProps {
  logo?: string | null;
}

const EventImage: React.FC<EventImageProps> = ({ logo }) => {
  if (logo) {
    return (
      <CldImage
        crop="fit"
        width={100}
        height={100}
        src={logo}
        alt="event-logo"
        className="w-12 h-12 object-cover object-center"
      />
    );
  }

  return (
    <Image
      src="/free-logo.png"
      width={48}
      height={48}
      alt="default-logo"
      className="w-12 h-12"
    />
  );
};

/* -------------------------------------------------- */
/* ------------------- Main Component --------------- */
/* -------------------------------------------------- */

const EventCard: React.FC<EventCardProps> = ({
  event,
  onCopy,
  onDelete,
  onExportPlayers,
  onSendCredentials,
}) => {
  const { ldoIdUrl } = useLdoId();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMenuHovered, setIsMenuHovered] = useState<boolean>(false);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // useClickOutside(menuContainerRef, () => setIsMenuOpen(false));

  /* ---------------- Memoized Values ---------------- */

  const formattedDateRange = useMemo(() => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const format = (date: Date) =>
      `${monthNamesShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    return `${format(start)} - ${format(end)}`;
  }, [event.startDate, event.endDate]);

  const eventDetailsUrl = useMemo(
    () => `/${event._id}/${ldoIdUrl}`,
    [event._id, ldoIdUrl]
  );

  const eventSettingsUrl = useMemo(
    () => `/${event._id}/settings/${ldoIdUrl}`,
    [event._id, ldoIdUrl]
  );

  /* ---------------- Handlers ---------------- */

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleCopy = useCallback(
    (e: React.SyntheticEvent) => {
      
      e.preventDefault();
      setIsMenuOpen(false);
      onCopy(e, event._id);
    },
    [event._id, onCopy]
  );

  const handleDelete = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      setIsMenuOpen(false);
      onDelete(e, event._id);
    },
    [event._id, onDelete]
  );

  const handleExport = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onExportPlayers(e, event._id);
    },
    [event._id, onExportPlayers]
  );

  const handleSend = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onSendCredentials(event._id);
    },
    [event._id, onSendCredentials]
  );

  /* ---------------- Render ---------------- */

  return (
    <div className="event-card mb-1 p-2 bg-gray-800 flex flex-col items-center gap-2 rounded-md relative">
      {/* Action Menu */}
      <div
        ref={menuContainerRef}
        className="absolute z-10 right-2 bottom-2"
        onMouseEnter={() => setIsMenuHovered(true)}
        onMouseLeave={() => setIsMenuHovered(false)}
      >
        <button
          type="button"
          onClick={toggleMenu}
          className={`p-2 rounded-lg transition-all duration-300 ${
            isMenuOpen || isMenuHovered
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'text-gray-500 hover:bg-gray-700/50'
          }`}
        >
          <Image
            src="/icons/dots-vertical.svg"
            alt="actions"
            width={20}
            height={20}
            className={`transition-transform duration-300 ${
              isMenuOpen ? 'rotate-90' : ''
            } svg-current`}
            style={{
              filter:
                isMenuOpen || isMenuHovered
                  ? 'brightness(0) invert(0.8)'
                  : 'brightness(0) invert(0.6)',
            }}
          />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-56 z-50 animate-slideDown">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-gray-700">
                <p className="text-xs font-medium text-yellow-500">Actions</p>
              </div>

              <ActionMenuItem
                icon="/icons/copy.svg"
                label="Copy"
                onClick={handleCopy}
              />

              <ActionMenuItem
                icon="/icons/send-email.svg"
                label={
                  event.sendCredentials
                    ? 'Resend Credential'
                    : 'Send Credentials'
                }
                onClick={handleSend}
              />

              <Link href={eventSettingsUrl}>
                <span>
                  <ActionMenuItem
                    icon="/icons/edit.svg"
                    label="Edit"
                    onClick={(e) => e.preventDefault()}
                  />
                </span>
              </Link>

              <ActionMenuItem
                icon="/icons/edit.svg"
                label="Export Players"
                onClick={handleExport}
              />

              <ActionMenuItem
                icon="/icons/delete.svg"
                label="Delete"
                onClick={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Link href={eventDetailsUrl} className="w-full text-center">
        <div className="flex justify-center items-center">
          <EventImage logo={event.logo} />
        </div>

        <h3 className="text-lg font-bold">{event.name}</h3>
        <p className="text-xs">{formattedDateRange}</p>
        <p>{event.description}</p>
        <p>{event.location}</p>
      </Link>
    </div>
  );
};

export default EventCard;