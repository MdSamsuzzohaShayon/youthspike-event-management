// components/team/TeamNavigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { } from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { IEvent, ITeam } from '@/types';
import TextImg from '../elements/TextImg';
import { Trophy, Users, Calendar, ExternalLink, BarChart3, CalendarDays } from 'lucide-react';

interface ITeamNavigationProps {
  team: ITeam;
  events: IEvent[];
  ldoIdUrl: string;
  totalPlayers: number;
}

const TeamNavigation = ({ team, events, ldoIdUrl, totalPlayers }: ITeamNavigationProps) => {
  const pathname = usePathname();

  const teamId = team._id;

  const navItems = [
    {
      name: 'Stats',
      href: `/teams/${teamId}/stats/${ldoIdUrl}`,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      name: 'Roster',
      href: `/teams/${teamId}/roster/${ldoIdUrl}`,
      icon: <Users className="w-4 h-4" />,
    },
    {
      name: 'Matches',
      href: `/teams/${teamId}/matches/${ldoIdUrl}`,
      icon: <CalendarDays className="w-4 h-4" />,
    },
  ];

  const isActive = (href: string) => pathname === href;

  {/* Header Section - Modern Glass Card */ }
  return (
    <div className="backdrop-blur-xl bg-gray-900/80 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-yellow-500/5">
      {/* Gradient Accent Line */}
      <div className="h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-transparent" />

      {/* Compact Header */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Section - Team Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-xl blur-md group-hover:blur-xl transition-all duration-300" />
              <TeamLogo team={team} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate leading-tight">
                {team?.name || 'Loading...'}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active Roster
                </span>
              </div>
            </div>
          </div>

          {/* Center Section - Stats */}
          <div className="flex items-center gap-6">
            <StatItem label="Total Players" value={totalPlayers} icon={<Users className="w-4 h-4" />} />
            <StatItem label="Events" value={events?.length || 0} icon={<Calendar className="w-4 h-4" />} />
          </div>

          {/* Right Section - Events */}
          {events && events.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Featured Events
              </h4>
              <div className="flex flex-wrap gap-2">
                {events.map((event) => (
                  <Link
                    href={`/${event._id}/${ldoIdUrl}`}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-logo text-black rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/25 hover:scale-105"
                    key={event._id}
                  >
                    {event.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}

      <div className="border-t border-gray-800/50 bg-gray-900/30">
        <nav className="flex flex-wrap items-center gap-1 p-1.5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
              relative group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 ease-out
              ${isActive(item.href)
                  ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/10 to-transparent'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }
            `}
            >
              {/* Active Indicator */}
              {isActive(item.href) && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
              )}

              {/* Icon with hover animation */}
              <span className={`
              transition-transform duration-200
              ${isActive(item.href) ? 'text-yellow-400' : 'text-gray-500 group-hover:scale-110'}
            `}>
                {item.icon}
              </span>

              {/* Label */}
              <span>{item.name}</span>

              {/* Hover Background Effect */}
              <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-colors -z-10" />
            </Link>
          ))}
        </nav>
      </div>

    </div>
  );


}


const TeamLogo = ({ team }: { team: ITeam }) =>
  team?.logo ? (
    <div className="relative w-14 h-14 md:w-16 md:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-transparent rounded-xl blur-md" />
      <CldImage
        alt={team.name}
        width={64}
        height={64}
        src={team.logo}
        className="relative w-full h-full rounded-xl border-2 border-yellow-500/40 object-cover object-center shadow-lg transition-transform duration-300 group-hover:scale-105"
        crop="fit"
      />
    </div>
  ) : (
    <div className="relative w-14 h-14 md:w-16 md:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-transparent rounded-xl blur-md" />
      <TextImg
        className="relative w-full h-full rounded-xl border-2 border-yellow-500/40 shadow-lg transition-transform duration-300 group-hover:scale-105"
        fullText={team?.name || ''}
        txtCls="text-base md:text-lg font-bold"
      />
    </div>
  );

const StatItem = ({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) => (
  <div className="text-center md:text-left group">
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
      {icon && <span className="text-yellow-logo">{icon}</span>}
      <span>{label}</span>
    </div>
    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
      {value}
    </div>
  </div>
);

export default TeamNavigation;