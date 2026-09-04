import { IArchiveEventCount } from '@/types'
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import { readDate, monthNamesShort } from '@/utils/datetime';
import React, { useMemo, useState, useCallback } from 'react';

interface IArchiveEventCardProps {
  event: IArchiveEventCount;
  onRestoreEvent: (eventId: string) => void;
}

/* -------------------------------------------------- */
/* ------------------ Sub Components ---------------- */
/* -------------------------------------------------- */

interface ActionMenuItemProps {
  icon: string;
  label: string;
  onClick: (e: React.SyntheticEvent) => void;
  className?: string;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  icon,
  label,
  onClick,
  className
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`${className || ""} w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 
               hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg 
               transition-all duration-200 group/item`}
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

const StatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all duration-200">
    <span className="text-lg font-bold leading-none text-white">
      {value}
    </span>
    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
      {label}
    </span>
  </div>
);

/* -------------------------------------------------- */
/* ------------------- Main Component --------------- */
/* -------------------------------------------------- */

const ArchiveEventCard: React.FC<IArchiveEventCardProps> = ({
  event,
  onRestoreEvent
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMenuHovered, setIsMenuHovered] = useState<boolean>(false);

  /* ---------------- Memoized Values ---------------- */

  const formattedDateRange = useMemo(() => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const format = (date: Date) =>
      `${monthNamesShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    return `${format(start)} - ${format(end)}`;
  }, [event.startDate, event.endDate]);

  /* ---------------- Handlers ---------------- */

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleRestore = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      setIsMenuOpen(false);
      onRestoreEvent(event._id);
    },
    [event._id, onRestoreEvent]
  );

  /* ---------------- Render ---------------- */

  return (
    <div className="event-card mb-1 p-2 bg-gray-800 flex flex-col items-center justify-center gap-2 rounded-md relative">
      {/* Action Menu */}
      <div
        className="absolute z-10 right-2 top-2"
        onMouseEnter={() => setIsMenuHovered(true)}
        onMouseLeave={() => setIsMenuHovered(false)}
      >
        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-56 z-50 animate-slideDown">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-gray-700">
                <p className="text-xs font-medium text-yellow-500">Actions</p>
              </div>

              <ActionMenuItem
                icon="/icons/restore.svg"
                label="Restore Event"
                onClick={handleRestore}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
            {event.logo ? (
              <CldImage
                crop="fit"
                width={48}
                height={48}
                src={event.logo}
                alt={event.name}
                className="w-12 h-12 object-cover object-center"
              />
            ) : (
              <TextImg
                className="w-12 h-12"
                fullText={event.name}
              />
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white line-clamp-2">
              {event.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Archived Event
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <StatItem label="Templates" value={event.relatedCounts.templates} />
          <StatItem label="Matches" value={event.relatedCounts.matches} />
          <StatItem label="Groups" value={event.relatedCounts.groups} />
          <StatItem label="Sponsors" value={event.relatedCounts.sponsors} />
        </div>

        {/* Date Info */}
        <div className="px-2 py-3 border-t border-gray-700/50">
          <p className="text-xs text-center text-gray-400">
            {formattedDateRange}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-2 py-3 border-t border-gray-700/50">

          <button
            onClick={handleRestore}
            type="button"
            className="btn-success"
          >
            Restore
          </button>
          <button
            onClick={handleRestore}
            type="button"
            className="btn-danger"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveEventCard;