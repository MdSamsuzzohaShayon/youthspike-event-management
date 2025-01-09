import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { removeCookie } from '@/utils/cookie';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import { IUserContext, UserRole } from '@/types/user';
import Image from 'next/image';
import Link from 'next/link';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { getEvent } from '@/utils/localStorage';
import { itemVariants, menuBackdropVariants, menuVariants } from '@/utils/animation';

interface IAdminMenuProps {
  user: IUserContext | null;
}

function AdminMenu({ user }: IAdminMenuProps) {
  // ===== Hooks =====
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { ldoIdUrl } = useLdoId();

  // ===== Local State =====
  const [eventId, setEventId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = (e: React.SyntheticEvent) => {
    e.preventDefault();
    removeCookie('token');
    removeCookie('user');
    return window.location.reload();
  };

  const fetchEvent = useCallback(() => {
    const eventExist = getEvent();
    if (params.eventId) {
      // @ts-ignore
      setEventId(params.eventId);
    } else if (eventExist) {
      setEventId(eventExist);
    } else {
      setEventId(null);
    }
  }, [params.eventId]);

  const handleMenuOpen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsMenuOpen(true);
    fetchEvent();
  };

  // ===== Component Mount =====
  useEffect(() => {
    fetchEvent();
  }, [params, router, pathname, fetchEvent]);

  // Lock the body scroll when the menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  if (!user || !user.token) return null;

  return (
    <div className="container mx-auto px-2">
      {/* Open Menu Button */}
      <button type="button" onClick={handleMenuOpen} className="menu-button rounded-md">
        <Image height={100} width={100} src="/icons/menu.svg" alt="Open Menu" className="w-10 mt-4 svg-white" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && <motion.div className="fixed inset-0 bg-black bg-opacity-60 z-40" initial="hidden" animate="visible" exit="hidden" variants={menuBackdropVariants} onClick={handleCloseMenu} />}
      </AnimatePresence>

      {/* Menu Content */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            className="menu-content bg-gray-900 w-4/5 md:w-2/5 absolute min-h-full top-0 left-0 z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
          >
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button type="button" onClick={handleCloseMenu} className="close-button focus:outline-none">
                <Image height={40} width={40} src="/icons/close.svg" alt="Close Menu" className="w-8 svg-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="user-info text-center mb-8">
              <Link onClick={() => setIsMenuOpen(false)} href={ADMIN_FRONTEND_URL}>
                <Image height={100} width={100} src="/free-logo.png" alt="User Avatar" className="w-16 h-16 mx-auto rounded-full border-2 border-yellow" />
              </Link>
              <h1 className="text-2xl text-yellow mt-4 capitalize">{`${user.info?.firstName} ${user.info?.lastName}`}</h1>
              {user.info?.team && <h3 className="text-sm text-gray-400">{user.info.team}</h3>}
              <p className="uppercase text-yellow text-sm mt-2">{user?.info?.role}</p>
            </div>

            {/* Menu Links */}
            <ul className="menu-list space-y-6">
              <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                <Link onClick={() => setIsMenuOpen(false)} href={ADMIN_FRONTEND_URL} className="flex items-center text-yellow hover:text-yellow-500 transition-all">
                  <Image height={40} width={40} src="/icons/home.svg" alt="Home" className="w-6 mr-4 svg-white" />
                  Home
                </Link>
              </motion.li>
              {eventId && (
                <>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={`${ADMIN_FRONTEND_URL}/${eventId}/settings/${ldoIdUrl}`}
                      className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/setting.svg" alt="Settings" className="w-6 mr-4 svg-white" />
                      Settings
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={`${ADMIN_FRONTEND_URL}/${eventId}/teams/${ldoIdUrl}`}
                      className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/teams.svg" alt="Teams" className="w-6 mr-4 svg-white" />
                      Teams
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={`${ADMIN_FRONTEND_URL}/${eventId}/groups/${ldoIdUrl}`}
                      className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/group.svg" alt="Groups" className="w-6 mr-4 svg-white" />
                      Groups
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={`${ADMIN_FRONTEND_URL}/${eventId}/players/${ldoIdUrl}`}
                      className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/players.svg" alt="Roster" className="w-6 mr-4 svg-white" />
                      Roster
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={`${ADMIN_FRONTEND_URL}/${eventId}/matches/${ldoIdUrl}`}
                      className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/trophy.svg" alt="Matches" className="w-6 mr-4 svg-white" />
                      Matches
                    </Link>
                  </motion.li>
                </>
              )}

              {user?.info?.role === UserRole.director && (
                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                  <Link onClick={() => setIsMenuOpen(false)} href={`${ADMIN_FRONTEND_URL}/account`} className="flex items-center text-yellow hover:text-yellow-500 transition-all">
                    <Image height={40} width={40} src="/icons/account.svg" alt="Account" className="w-6 mr-4 svg-white" />
                    Account
                  </Link>
                </motion.li>
              )}

              {user?.info?.role === UserRole.admin && (
                <>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link onClick={() => setIsMenuOpen(false)} href={`${ADMIN_FRONTEND_URL}/admin`} className="flex items-center text-yellow hover:text-yellow-500 transition-all">
                      <Image height={40} width={40} src="/icons/account.svg" alt="Admin" className="w-6 mr-4 svg-white" />
                      Admin
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link onClick={() => setIsMenuOpen(false)} href={`${ADMIN_FRONTEND_URL}/admin/directors`} className="flex items-center text-yellow hover:text-yellow-500 transition-all">
                      <Image height={40} width={40} src="/icons/account.svg" alt="Admin" className="w-6 mr-4 svg-white" />
                      LDOs
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                    <Link onClick={() => setIsMenuOpen(false)} href={`${ADMIN_FRONTEND_URL}/events/tournament`} className="flex items-center text-yellow hover:text-yellow-500 transition-all">
                      <Image height={40} width={40} src="/icons/event.svg" alt="Tournament" className="w-6 mr-4 svg-white" />
                      Tournament
                    </Link>
                  </motion.li>
                </>
              )}
            </ul>

            {/* Logout Button */}
            <div className="mt-auto pt-4">
              <button type="button" onClick={handleLogout} className="btn-danger mt-10 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-md text-center w-full transition-all">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminMenu;
