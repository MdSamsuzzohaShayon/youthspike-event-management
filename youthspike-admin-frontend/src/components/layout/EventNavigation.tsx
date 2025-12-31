import { IEvent } from '@/types';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import { readDate } from '@/utils/datetime';
import { useLdoId } from '@/lib/LdoProvider';
import { IUserContext, UserRole } from '@/types/user';
import { getUserFromCookie } from '@/utils/clientCookie';

interface IProps {
  event: IEvent | null;
}

interface UserRoleFlags {
  isAdmin: boolean;
  isDirector: boolean;
  isPlayer: boolean;
  isAdminOrDirector: boolean;
}

interface NavigationItem {
  label: string;
  href: string;
  shouldShow: boolean;
}

// Sub-component: EventLogo
const EventLogo = ({ event }: { event: IEvent }) => (
  <div className="relative group">
    <div className="absolute -inset-1 blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"/>
    {event.logo ? (
      <CldImage 
        src={event.logo} 
        alt={event.name} 
        className="relative w-10" 
        height={40} 
        width={40} 
      />
    ) : (
      <div className="relative">
        <TextImg className="w-10" fullText={event.name} />
      </div>
    )}
  </div>
);

// Sub-component: InfoWithIcon
const InfoWithIcon = ({ 
  iconSrc, 
  alt, 
  text,
  className = '',
  textClassName = ''
}: { 
  iconSrc: string; 
  alt: string; 
  text: string;
  className?: string;
  textClassName?: string;
}) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <Image 
      height={12} 
      width={12} 
      className="w-3 h-3 svg-white" 
      src={iconSrc} 
      alt={alt} 
    />
    <span className={textClassName}>{text}</span>
  </div>
);

// Sub-component: NavigationLink
const NavigationLink = ({ 
  href, 
  label 
}: { 
  href: string; 
  label: string;
}) => (
  <Link href={href} className="group relative block">
    <div className="absolute inset-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-md"></div>
    <div className="relative px-3 py-2">
      <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
        {label}
      </span>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </div>
  </Link>
);

// Sub-component: EventHeader
const EventHeader = ({ event }: { event: IEvent }) => (
  <div className="px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <EventLogo event={event} />
      
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-white">{event.name}</h2>
        {event.location && (
          <InfoWithIcon
            iconSrc="/icons/location.svg"
            alt="location"
            text={event.location}
            className="text-xs text-gray-300"
            textClassName="truncate max-w-[180px]"
          />
        )}
      </div>
    </div>

    <div className="hidden sm:block text-right">
      <InfoWithIcon
        iconSrc="/icons/clock.svg"
        alt="date"
        text={readDate(event.startDate)}
        className="text-xs text-yellow-logo justify-end"
        textClassName="font-medium"
      />
      <div className="text-[10px] text-gray-400">to {readDate(event.endDate)}</div>
    </div>
  </div>
);

// Sub-component: QuickInfoBar
const QuickInfoBar = ({ event }: { event: IEvent }) => (
  <div className="px-4 py-2 border-y border-gray-800">
    <div className="flex items-center gap-4 text-xs">
      <InfoWithIcon
        iconSrc="/icons/location.svg"
        alt="description"
        text={event.description}
        className="text-gray-300"
        textClassName="truncate max-w-[300px]"
      />

      <div className="sm:hidden flex items-center gap-1 text-yellow-logo ml-auto">
        <Image 
          height={12} 
          width={12} 
          className="w-3 h-3 svg-white" 
          src="/icons/clock.svg" 
          alt="date" 
        />
        <span className="text-[10px]">{readDate(event.startDate)}</span>
      </div>
    </div>
  </div>
);

// Sub-component: NavigationBar
const NavigationBar = ({ 
  eventId, 
  ldoIdUrl, 
  userRoleFlags 
}: { 
  eventId: string; 
  ldoIdUrl: string; 
  userRoleFlags: UserRoleFlags;
}) => {
  const { isPlayer, isAdmin } = userRoleFlags;
  
  const navigationItems: NavigationItem[] = [
    {
      label: 'Settings',
      href: `/${eventId}/settings/${ldoIdUrl}`,
      shouldShow: true // Always show for all users
    },
    {
      label: 'Teams',
      href: `/${eventId}/teams/${ldoIdUrl}`,
      shouldShow: !isPlayer
    },
    {
      label: 'Groups',
      href: `/${eventId}/groups/${ldoIdUrl}`,
      shouldShow: !isPlayer
    },
    {
      label: 'Team Standings',
      href: `/${eventId}/teamstandings/${ldoIdUrl}`,
      shouldShow: !isPlayer
    },
    {
      label: 'Roster',
      href: `/${eventId}/players/${ldoIdUrl}`,
      shouldShow: true // Always show for all users
    },
    {
      label: 'Account',
      href: `/account`,
      shouldShow: true // Always show for all users
    },
    {
      label: 'Matches',
      href: `/${eventId}/matches/${ldoIdUrl}`,
      shouldShow: true // Always show for all users
    },
    {
      label: 'Admin',
      href: `/admin`,
      shouldShow: isAdmin
    },
    {
      label: 'LDOs',
      href: `/admin/directors`,
      shouldShow: isAdmin
    }
  ];

  return (
    <nav className="px-2 py-1">
      <ul className="flex items-center overflow-x-auto overflow-y-hidden -mx-2 scrollbar-hide">
        {navigationItems.map((item) => (
          item.shouldShow && (
            <li key={item.label} className="flex-shrink-0 px-2">
              <NavigationLink href={item.href} label={item.label} />
            </li>
          )
        ))}
      </ul>
    </nav>
  );
};

function EventNavigation({ event }: IProps) {
  const [user, setUser] = useState<IUserContext | null>(null);
  const { ldoIdUrl } = useLdoId();

  useEffect(() => {
    const userDetail = getUserFromCookie();
    setUser(userDetail || null);
  }, []);

  const userRoleFlags = useMemo((): UserRoleFlags => {
    if (!user || !user.info?.role) {
      return {
        isAdmin: false,
        isDirector: false,
        isPlayer: false,
        isAdminOrDirector: false
      };
    }

    const userRole = user.info.role;
    const isAdmin = userRole === UserRole.admin;
    const isDirector = userRole === UserRole.director;
    const isPlayer = userRole === UserRole.player;
    const isAdminOrDirector = isAdmin || isDirector;

    return {
      isAdmin,
      isDirector,
      isPlayer,
      isAdminOrDirector
    };
  }, [user]);

  if (!event) {
    return <p className="text-white p-4">No event found!</p>;
  }

  return (
    <div className="min-h-fit border-b border-yellow-500/20 shadow-2xl">
      <EventHeader event={event} />
      <QuickInfoBar event={event} />
      <NavigationBar 
        eventId={event._id} 
        ldoIdUrl={ldoIdUrl} 
        userRoleFlags={userRoleFlags} 
      />
      
      <div className="sm:hidden px-4 py-1 flex justify-center">
        <div className="w-8 h-[2px]"></div>
      </div>
    </div>
  );
}

export default EventNavigation;