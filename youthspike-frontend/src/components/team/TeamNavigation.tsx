// components/team/TeamNavigation.tsx

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import { IEvent, IEventRelatives, ITeam } from '@/types';
import TextImg from '../elements/TextImg';
import { Trophy, Users, Calendar, ExternalLink, BarChart3, CalendarDays, Star, Activity, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { CURRENT_EVENT_ID } from '@/utils/constant';

interface ITeamNavigationProps {
  team: ITeam;
  events: IEventRelatives[];
  ldoIdUrl: string;
  totalPlayers: number;
}

const TeamNavigation = ({ team, events, ldoIdUrl, totalPlayers }: ITeamNavigationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const teamId = team._id;

  const navItems = [
    {
      name: 'Stats',
      href: `/teams/${teamId}/stats/${ldoIdUrl}`,
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Performance metrics',
    },
    {
      name: 'Roster',
      href: `/teams/${teamId}/roster/${ldoIdUrl}`,
      icon: <Users className="w-4 h-4" />,
      description: 'Team members',
    },
    {
      name: 'Matches',
      href: `/teams/${teamId}/matches/${ldoIdUrl}`,
      icon: <CalendarDays className="w-4 h-4" />,
      description: 'Game history',
    },
  ];

  const selectedEvent = useMemo(() => {
    const cei = searchParams.get(CURRENT_EVENT_ID);
    if (!cei) return null;
    return events.find(evt => evt._id === cei);
  }, [searchParams, events]);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="relative mb-6">
      {/* Animated background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent rounded-3xl blur-2xl opacity-50 animate-pulse" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-950/95 rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
        
        {/* Animated gradient border top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-3xl" />

        {/* Header content */}
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
            
            {/* Team Identity Section */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* Logo with orbital ring */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 via-yellow-400/20 to-transparent rounded-2xl rotate-45 animate-spin-slow" />
                <TeamLogo team={team} />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent truncate">
                    {team?.name || 'Loading...'}
                  </h1>
                  <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-pulse" fill="currentColor" />
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full text-xs font-medium text-green-400 border border-green-500/20">
                    <Activity className="w-3 h-3" />
                    Active
                  </span>
                  <span className="text-xs text-gray-500">#{teamId.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden lg:block" />
              <div className="flex gap-4 lg:gap-6">
                <StatCard 
                  label="Roster Size" 
                  value={totalPlayers} 
                  icon={<Users className="w-4 h-4" />}
                  trend="+2 this season"
                />
                <StatCard 
                  label="Events" 
                  value={events?.length || 0} 
                  icon={<Calendar className="w-4 h-4" />}
                  trend="Active participation"
                />
              </div>
            </div>

            {/* Events Section */}
            <div className="lg:ml-auto">
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden lg:block absolute left-0" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {selectedEvent ? 'Current Event' : 'Participating Events'}
                  </h4>
                </div>
                
                {selectedEvent ? (
                  <Link
                    href={`/${selectedEvent._id}/${ldoIdUrl}`}
                    className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-105 active:scale-95"
                  >
                    <span className="relative">
                      {selectedEvent.name}
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-black rounded-full animate-ping" />
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                ) : events && events.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {events.slice(0, 3).map((event) => (
                      <Link
                        key={event._id}
                        href={`/${event._id}/${ldoIdUrl}`}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200 hover:scale-105"
                      >
                        {event.name}
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                    {events.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs font-medium border border-gray-700">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                )}
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
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative group flex items-center gap-2.5 px-4 py-3 rounded-xl
                      transition-all duration-300 ease-out flex-1 sm:flex-none justify-center sm:justify-start
                      ${active
                        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-yellow-400 shadow-lg shadow-yellow-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }
                    `}
                  >
                    {/* Active indicator line */}
                    {active && (
                      <>
                        <span className="absolute top-0 inset-x-4 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
                        <span className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-xl" />
                      </>
                    )}

                    {/* Icon container */}
                    <span className={`
                      relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                      ${active 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-gray-800/50 text-gray-500 group-hover:bg-gray-700/50 group-hover:text-gray-300'
                      }
                    `}>
                      {item.icon}
                      {active && (
                        <span className="absolute inset-0 bg-yellow-400/20 rounded-lg animate-ping" />
                      )}
                    </span>

                    {/* Text content */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium leading-tight">{item.name}</span>
                      <span className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                        {item.description}
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

// Team Logo Component
const TeamLogo = ({ team }: { team: ITeam }) => (
  team?.logo ? (
    <div className="relative w-16 h-16 md:w-20 md:h-20">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/40 to-yellow-600/10 rounded-2xl blur-lg animate-pulse" />
      <CldImage
        alt={team.name}
        width={80}
        height={80}
        src={team.logo}
        className="relative w-full h-full rounded-2xl border-2 border-yellow-500/30 object-cover object-center shadow-2xl transition-all duration-500 hover:border-yellow-400/60 hover:shadow-yellow-500/20 hover:scale-105"
        crop="fit"
      />
    </div>
  ) : (
    <div className="relative w-16 h-16 md:w-20 md:h-20">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/40 to-yellow-600/10 rounded-2xl blur-lg animate-pulse" />
      <TextImg
        className="relative w-full h-full rounded-2xl border-2 border-yellow-500/30 shadow-2xl transition-all duration-500 hover:border-yellow-400/60 hover:shadow-yellow-500/20 hover:scale-105"
        fullText={team?.name || ''}
        txtCls="text-lg md:text-xl font-bold"
      />
    </div>
  )
);

// Enhanced Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon, 
  trend 
}: { 
  label: string; 
  value: number; 
  icon?: React.ReactNode;
  trend?: string;
}) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative px-4 py-3 rounded-2xl border border-gray-800/50 group-hover:border-yellow-500/20 transition-all duration-300">
      <div className="flex items-center gap-2 mb-1">
        {icon && (
          <span className="text-yellow-400 bg-yellow-500/10 p-1.5 rounded-lg">
            {icon}
          </span>
        )}
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {value}
        </span>
        {trend && (
          <span className="text-[10px] text-gray-500 hidden md:inline">
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default TeamNavigation;