import { ITeam } from '@/types';
import { FRONTEND_URL } from '@/utils/keys';
import Link from 'next/link';
import React from 'react';

interface ITeamNavigationProps {
  eventId: string;
  ldoIdUrl: string;
  team: ITeam;
  pathname: string;
}

const TeamNavigation = ({ eventId, ldoIdUrl, team, pathname }: ITeamNavigationProps) => {
  const isRosterPage = pathname === `/teams/${team._id}/roster`;
  const isMatchesPage = pathname === `/teams/${team._id}/matches`;

  return (
    <div className="px-3 py-2">
      <div className="flex gap-2 bg-gray-700 rounded-lg p-1 mb-2">
        <NavLink href={`/events/${eventId}/teams/${ldoIdUrl}`} isActive={false}>
          Standings
        </NavLink>
        <NavLink href={`${FRONTEND_URL}/events/${eventId}/teams/?&search=${team?.name?.split(' ').join('+')}`} isActive={false}>
          Stats
        </NavLink>
      </div>

      <div className="flex gap-2 bg-gray-700 rounded-lg p-1">
        <NavLink href={`/teams/${team._id}/roster`} isActive={isRosterPage}>
          ROSTER
        </NavLink>
        <NavLink href={`/teams/${team._id}/matches`} isActive={isMatchesPage}>
          MATCHES
        </NavLink>
      </div>
    </div>
  );
};

const NavLink = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) => (
  <Link
    href={href}
    className={`uppercase flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all text-center ${isActive ? 'bg-yellow-logo text-gray-900 shadow-sm' : 'text-gray-300 hover:text-white bg-gray-700'}`}
  >
    {children}
  </Link>
);

export default TeamNavigation;
