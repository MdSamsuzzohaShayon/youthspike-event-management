'use client';

import { useEffect, useRef, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { BADGE_IMAGE_SIZE } from '@/utils/constant';
import BadgeIcon from '@/components/badge/BadgeIcon';
import { IBadge } from '@/types';

interface Badge {
  _id: string;
  name: string;
  icon: string;
}

type BadgeSelectChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement
>;

interface IBadgeSelectProps {
  name: string;
  value?: string;
  badges: Badge[];
  placeholder?: string;
  className?: string;
  onChange?: (e: BadgeSelectChangeEvent) => void;
}

export default function BadgeSelect({
  name,
  value,
  badges,
  placeholder = 'Select Badge',
  className = '',
  onChange,
}: IBadgeSelectProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBadge = badges.find((b) => b._id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (badgeId: string) => {
    setOpen(false);
  
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: {
        name,
        value: badgeId,
      },
      currentTarget: {
        name,
        value: badgeId,
      },
    } as BadgeSelectChangeEvent;
  
    onChange?.(syntheticEvent);
  };

  return (
    <div className={`relative ${className || ''}`} ref={containerRef}>
      {/* Button */}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full p-2 items-center justify-between rounded-md border border-gray-700 bg-gray-800 shadow-lg transition-all duration-300 hover:border-yellow-400 hover:shadow-yellow-500/20"
      >
        <div className="flex items-center gap-3">
          {selectedBadge ? (
            <>
              <div className="overflow-hidden rounded-md border border-gray-700">
                <BadgeIcon badge={selectedBadge as IBadge} className='h-6 w-6 object-cover transition-transform duration-300 group-hover:scale-105' />
              </div>

              <span className="font-medium text-white">
                {selectedBadge.name}
              </span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <svg
          className={`h-5 w-5 text-yellow-400 transition-transform duration-300 ${open ? 'rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}

      <div
        className={`absolute z-50 mt-3 max-h-80 w-full overflow-y-auto rounded-md border border-yellow-500/20 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300
          ${open
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 -translate-y-2'
          }
        `}
      >
        {badges.map((badge) => {
          const active = badge._id === value;

          return (
            <button
              key={badge._id}
              type="button"
              onClick={() => handleSelect(badge._id)}
              className={` group flex w-full items-center gap-4 px-4 py-3 transition-all duration-200
                ${active
                  ? 'bg-yellow-500/15'
                  : 'hover:bg-yellow-500/10'
                }
              `}
            >
              <div className="overflow-hidden rounded-lg border border-yellow-500/20">
                <BadgeIcon badge={badge as IBadge} className="h-12 w-12 object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>

              <div className="flex flex-1 flex-col items-start">
                <span className="font-medium text-white">
                  {badge.name}
                </span>

                <span className="text-xs text-gray-500">
                  Badge
                </span>
              </div>

              {active && (
                <div className="h-3 w-3 rounded-full bg-yellow-400 shadow-[0_0_12px_#facc15]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}