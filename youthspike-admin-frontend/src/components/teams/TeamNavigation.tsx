// components/team/TeamNavigation.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import { IEvent, ITeam, UserRole, UserRoleFlags } from '@/types';
import TextImg from '../elements/TextImg';
import {
  Trophy,
  Users,
  ExternalLink,
  BarChart3,
  CalendarDays,
  Settings,
  Users2,
  LayoutGrid,
  Medal,
  Mail,
  Swords,
  Shield,
  ChevronDown,
  Star,
  Menu,
  X,
  BadgeIcon
} from 'lucide-react';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT, USER_ROLE_DEFAULTS } from '@/utils/constant';
import { useUser } from '@/lib/UserProvider';
import { FRONTEND_URL } from '@/utils/keys';
import EventNavigationLink from '../event/EventNavigationLink';

// Types
interface ITeamNavigationProps {
  team: ITeam;
  events: IEvent[];
  ldoIdUrl: string;
  totalPlayers: number;
}

interface TeamNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}


const TEAM_NAV_ITEMS: TeamNavItem[] = [
  {
    name: 'Stats',
    href: '',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
  },
  {
    name: 'Roster',
    href: '',
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    name: 'Matches',
    href: '',
    icon: <CalendarDays className="w-3.5 h-3.5" />,
  },
];

// Helper Functions

const getSelectedEvent = (events: IEvent[]): IEvent | null => {
  const eventId = SessionStorageService.getItem(CURRENT_EVENT);
  if (!eventId) return null;
  return events.find((event) => event._id === eventId) ?? null;
};

const generateTeamNavItems = (teamId: string, ldoIdUrl: string): TeamNavItem[] => {
  return TEAM_NAV_ITEMS.map((item) => ({
    ...item,
    href: `/teams/${teamId}/${item.name.toLowerCase()}/${ldoIdUrl}`,
  }));
};

const getUserRoleFlags = (userRole: UserRole | undefined): UserRoleFlags => {
  if (!userRole) return USER_ROLE_DEFAULTS;

  const isAdmin = userRole === UserRole.admin;
  const isDirector = userRole === UserRole.director;

  return {
    isAdmin,
    isDirector,
    isPlayer: userRole === UserRole.player,
    isAdminOrDirector: isAdmin || isDirector,
    isCaptain: userRole === UserRole.captain,
    isCoCaptain: userRole === UserRole.co_captain,
  };
};



// Sub-components


const TeamLogo: React.FC<{ team: ITeam }> = ({ team }) => {
  if (!team?.name) {
    return (
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-500">N/A</span>
      </div>
    );
  }

  if (team.logo) {
    return (
      <div className="relative w-10 h-10 sm:w-12 sm:h-12">
        <CldImage
          alt={team.name}
          width={48}
          height={48}
          src={team.logo}
          className="w-full h-full rounded-lg border border-yellow-500/20 object-cover shadow-lg"
          crop="fit"
        />
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 sm:w-12 sm:h-12">
      <TextImg
        className="w-full h-full rounded-lg border border-yellow-500/20 shadow-lg"
        fullText={team.name}
        txtCls="text-sm font-bold"
      />
    </div>
  );
};

const TeamStats: React.FC<{ totalPlayers: number; eventsCount: number }> = ({
  totalPlayers,
  eventsCount
}) => (
  <div className="flex items-center gap-3 mt-1">
    <span className="flex items-center gap-1 text-[11px] text-gray-400">
      <Users className="w-3 h-3 text-gray-500" />
      {totalPlayers}
    </span>
    <span className="flex items-center gap-1 text-[11px] text-gray-400">
      <Trophy className="w-3 h-3 text-gray-500" />
      {eventsCount} events
    </span>
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
      <span className="text-[11px] text-gray-500">Active</span>
    </span>
  </div>
);

const EventSelector: React.FC<{
  selectedEvent: IEvent | null;
  events: IEvent[];
  ldoIdUrl: string;
  onOpenModal: () => void;
}> = ({ selectedEvent, events, ldoIdUrl, onOpenModal }) => {
  if (selectedEvent) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-all"
      >
        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-xs font-medium text-white hidden sm:block">
          {selectedEvent.name}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
    );
  }

  if (events.length > 0) {
    return (
      <Link
        href={`/${events[0]._id}/${ldoIdUrl}`}
        className="btn-info"
      >
        View Event
      </Link>
    );
  }

  return null;
};

const MobileMenuButton: React.FC<{
  isOpen: boolean;
  onClick: () => void;
}> = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="sm:hidden p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
  >
    {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
  </button>
);

const EventModal: React.FC<{
  events: IEvent[];
  ldoIdUrl: string;
  modalRef: React.RefObject<HTMLDialogElement | null>;
}> = ({ events, ldoIdUrl, modalRef }) => {
  const handleClose = useCallback(() => {
    modalRef.current?.close();
  }, [modalRef]);

  const handleEventClick = useCallback(() => {
    modalRef.current?.close();
  }, [modalRef]);

  if (events.length === 0) {
    return (
      <dialog ref={modalRef} className="modal-dialog">
        <div className="p-4 text-center">
          <p className="text-gray-400">No events available</p>
          <button
            onClick={handleClose}
            className="mt-2 text-sm text-yellow-400 hover:text-yellow-300"
          >
            Close
          </button>
        </div>
      </dialog>
    );
  }

  return (
    <dialog ref={modalRef} className="modal-dialog">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Select Event
          </h3>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {events.map((event) => (
            <Link
              key={event._id}
              href={`/${event._id}/${ldoIdUrl}`}
              onClick={handleEventClick}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:border-yellow-500/30 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-white truncate">
                {event.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-600 ml-auto flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </dialog>
  );
};


const TeamNavTabs: React.FC<{
  navItems: TeamNavItem[];
  currentPath: string;
}> = ({ navItems, currentPath }) => {
  const isActive = useCallback(
    (href: string) => currentPath === href,
    [currentPath]
  );

  return (
    <div className="p-1.5">
      <nav className="flex gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${active
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                }
              `}
            >
              <span className={active ? 'text-yellow-400' : 'text-gray-500'}>
                {item.icon}
              </span>
              <span className="hidden sm:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

// Main Component
const TeamNavigation: React.FC<ITeamNavigationProps> = ({
  team,
  events,
  ldoIdUrl,
  totalPlayers
}) => {
  const pathname = usePathname();
  const user = useUser();
  const eventsRef = useRef<HTMLDialogElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRoleFlags = useMemo(
    () => getUserRoleFlags(user?.info?.role),
    [user?.info?.role]
  );

  const selectedEvent = useMemo(
    () => getSelectedEvent(events),
    [events]
  );

  const teamNavItems = useMemo(
    () => generateTeamNavItems(team._id, ldoIdUrl),
    [team._id, ldoIdUrl]
  );

  const handleOpenModal = useCallback(() => {
    eventsRef.current?.showModal();
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  if (!team?._id) {
    return (
      <div className="relative mb-4 p-4 bg-gray-900/80 rounded-2xl border border-gray-800 text-center">
        <p className="text-gray-400">Team information not available</p>
      </div>
    );
  }

  return (
    <div className="relative mb-4">
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-transparent" />

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1 bg-yellow-500/20 rounded-xl blur-md" />
                <TeamLogo team={team} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                    {team.name}
                  </h1>
                  {userRoleFlags.isCaptain && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                      <Star className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400 font-medium">Captain</span>
                    </span>
                  )}
                </div>

                <TeamStats
                  totalPlayers={totalPlayers}
                  eventsCount={events?.length ?? 0}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <EventSelector
                selectedEvent={selectedEvent}
                events={events}
                ldoIdUrl={ldoIdUrl}
                onOpenModal={handleOpenModal}
              />

              <MobileMenuButton
                isOpen={mobileMenuOpen}
                onClick={handleToggleMobileMenu}
              />
            </div>
          </div>
        </div>

        <div className={`border-t border-gray-800/50 bg-gray-900/30 ${mobileMenuOpen ? 'block' : 'hidden sm:block'}`}>
          <EventNavigationLink
            eventId={selectedEvent?._id ?? ""}
            ldoIdUrl={ldoIdUrl}
            teamId={team._id}
            userRoleFlags={userRoleFlags}
          />
        </div>

        <div className="border-t border-gray-800/50 bg-gray-900/20">
          <TeamNavTabs
            navItems={teamNavItems}
            currentPath={pathname}
          />
        </div>

        <EventModal
          events={events}
          ldoIdUrl={ldoIdUrl}
          modalRef={eventsRef}
        />
      </div>
    </div>
  );
};

export default TeamNavigation;