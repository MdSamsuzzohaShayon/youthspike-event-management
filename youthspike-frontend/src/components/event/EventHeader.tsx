// components/event/EventHeader.tsx

'use client';

import { IEvent } from '@/types';
import { readDate } from '@/utils/datetime';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  Calendar, 
  Trophy, 
  Users, 
  Activity, 
  ChevronRight, 
  Star,
  MapPin,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useMemo } from 'react';

interface IEventHeaderProps {
  event: IEvent | null;
  eventId: string;
}

const EventHeader = ({ event, eventId }: IEventHeaderProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabs = [
    {
      name: "Players",
      segment: "players",
      icon: <Users className="w-4 h-4" />,
      description: "Participant list",
    },
    {
      name: "Standings",
      segment: "teams",
      icon: <Trophy className="w-4 h-4" />,
      description: "Team rankings",
    },
    {
      name: "Matches",
      segment: "matches",
      icon: <Target className="w-4 h-4" />,
      description: "Game schedule",
    },
  ];

  // Convert existing search params → "?key=value&x=y"
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  const eventStats = useMemo(() => {
    return [
      {
        label: 'Status',
        value: 'Live',
        icon: <Activity className="w-4 h-4" />,
        trend: 'In progress',
      },
      {
        label: 'Duration',
        value: event ? `${readDate(event.startDate as string)}` : 'TBA',
        icon: <Calendar className="w-4 h-4" />,
        trend: event ? `to ${readDate(event.endDate as string)}` : '',
      },
    ];
  }, [event]);

  return (
    <div className="relative mb-6">
      {/* Animated background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent rounded-3xl blur-2xl opacity-50 animate-pulse" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-950/95 rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
        
        {/* Animated gradient border top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/5 to-transparent rounded-tr-full" />
        
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl" />

        {/* Header content */}
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
            
            {/* Event Identity Section */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* Logo with orbital ring */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 via-yellow-400/20 to-transparent rounded-2xl rotate-45 animate-spin-slow" />
                
                <Link href="/" className="group relative block">
                  <div className="relative rounded-xl border border-gray-700/50 bg-gray-800/50 p-2 backdrop-blur-md transition-all duration-300 group-hover:border-yellow-500/40 group-hover:bg-gray-800/80">
                    {event?.logo ? (
                      <CldImage 
                        src={event.logo} 
                        alt={event.name || "Event Logo"} 
                        width={100} 
                        height={100}
                        className="w-14 md:w-16 object-contain transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <Image
                        alt="Event Logo"
                        width={100}
                        height={100}
                        className="w-14 md:w-16 object-contain transition-transform duration-300 group-hover:scale-105"
                        src="/free-logo.png"
                      />
                    )}
                  </div>
                </Link>
              </div>
              
              <div className="min-w-0 flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-500/10 rounded-full text-xs font-medium text-green-400 border border-green-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE EVENT
                  </span>
                  {event?.divisions && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 rounded-full text-xs font-medium text-yellow-400 border border-yellow-500/20">
                      <Star className="w-3 h-3" />
                      {event.divisions}
                    </span>
                  )}
                </div>
                
                {/* Event Title */}
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent truncate">
                  {event?.name || "2025 PRO LEAGUE"}
                </h1>
                
                {/* Event Details */}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                    {readDate(event?.startDate as string)} — {readDate(event?.endDate as string)}
                  </span>
                  {event?.location && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                      {event.location}
                    </span>
                  )}
                </div>

                {/* Description */}
                {event?.description && (
                  <p className="mt-2 line-clamp-1 md:line-clamp-2 text-xs md:text-sm text-gray-400">
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Event Stats */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden lg:block" />
              <div className="flex gap-4 lg:gap-6">
                {eventStats.map((stat, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative px-4 py-3 rounded-2xl border border-gray-800/50 group-hover:border-yellow-500/20 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 bg-yellow-500/10 p-1.5 rounded-lg">
                          {stat.icon}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate max-w-[120px]">
                          {stat.value}
                        </span>
                      </div>
                      {stat.trend && (
                        <span className="text-[10px] text-gray-500 hidden md:block">
                          {stat.trend}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="relative">
          {/* Subtle divider with gradient */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
          
          <nav className="relative p-2">
            {/* Active tab background indicator */}
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const href = `/events/${eventId}/${tab.segment}${suffix}`;
                const isActive = pathname.endsWith(`/${tab.segment}`);
                
                return (
                  <Link
                    key={tab.segment}
                    href={href}
                    className={`
                      relative group flex items-center gap-2.5 px-4 py-3 rounded-xl
                      transition-all duration-300 ease-out flex-1 sm:flex-none justify-center sm:justify-start
                      ${isActive
                        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-yellow-400 shadow-lg shadow-yellow-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }
                    `}
                  >
                    {/* Active indicator line */}
                    {isActive && (
                      <>
                        <span className="absolute top-0 inset-x-4 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
                        <span className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-xl" />
                      </>
                    )}

                    {/* Icon container */}
                    <span className={`
                      relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-700/50 group-hover:text-gray-300'
                      }
                    `}>
                      {tab.icon}
                      {isActive && (
                        <span className="absolute inset-0 bg-yellow-400/20 rounded-lg animate-ping" />
                      )}
                    </span>

                    {/* Text content */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium leading-tight">
                        {tab.name}
                      </span>
                      <span className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                        {tab.description}
                      </span>
                    </div>

                    {/* Hover glow effect */}
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;