import React, { useState, useEffect, useRef } from 'react';
import { useLdoId } from '@/lib/LdoProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import LocalStorageService from '@/utils/LocalStorageService';
import { EEventItem } from '@/types/event';
import { EVENT_ITEM } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';

function PublicMenu() {
  // ===== Hooks =====
  const pathname = usePathname();
  const params = useParams();
  const { ldoIdUrl } = useLdoId();

  // ===== Local State =====
  const [eventId, setEventId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [redirectSymbol, setRedirectSymbol] = useState<string>('?');

  // ===== Component Mount =====
  useEffect(() => {
    const eventExist = LocalStorageService.getEvent();
    if (eventExist) {
      setEventId(eventExist);
    }
    if (params?.eventId) {
      // @ts-ignore
      setEventId(params.eventId);
    }
  }, [params, pathname]);

  useEffect(() => {
    if (ldoIdUrl && ldoIdUrl !== '') {
      setRedirectSymbol('&');
    }
  }, [ldoIdUrl]);

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

  return (
    <div className="container mx-auto px-2">
      {/* Open Menu Button */}
      <button type="button" onClick={() => setIsMenuOpen(true)} className="menu-button rounded-md">
        <Image height={100} width={100} src="/icons/menu.svg" alt="Open Menu" className="w-10 mt-4 svg-white" />
      </button>

      {/* Backdrop */}
        {isMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={handleCloseMenu} />}

      {/* Menu Content */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="menu-content bg-gray-900 w-4/5 md:w-2/5 absolute min-h-full top-0 left-0 z-50 p-6 flex flex-col shadow-2xl"
          >
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button type="button" onClick={handleCloseMenu} className="close-button focus:outline-none">
                <Image height={40} width={40} src="/icons/close.svg" alt="Close Menu" className="w-8 svg-white" />
              </button>
            </div>

            {/* Menu Links */}
            <ul className="menu-list space-y-6 flex-grow">
              <li className="text-lg capitalize">
                <Link onClick={handleCloseMenu} href="/" className="flex items-center hover:text-yellow-400 transition-all">
                  <Image height={40} width={40} src="/icons/home.svg" alt="Home" className="w-6 mr-4 svg-white" />
                  Home
                </Link>
              </li>
              {eventId && (
                <>
                  <li className="text-lg capitalize">
                    <Link
                      onClick={handleCloseMenu}
                      href={`/events/${eventId}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}`}
                      className="flex items-center hover:text-yellow-400 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/teams.svg" alt="Teams" className="w-6 mr-4 svg-white" />
                      Teams
                    </Link>
                  </li>
                  <li className="text-lg capitalize">
                    <Link
                      onClick={handleCloseMenu}
                      href={`/events/${eventId}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.PLAYER}`}
                      className="flex items-center hover:text-yellow-400 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/players.svg" alt="Roster" className="w-6 mr-4 svg-white" />
                      Roster
                    </Link>
                  </li>
                  <li className="text-lg capitalize">
                    <Link
                      onClick={handleCloseMenu}
                      href={`/events/${eventId}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.MATCH}`}
                      className="flex items-center hover:text-yellow-400 transition-all"
                    >
                      <Image height={40} width={40} src="/icons/trophy.svg" alt="Matches" className="w-6 mr-4 svg-white" />
                      Matches
                    </Link>
                  </li>
                </>
              )}

              <li className="text-lg capitalize">
                <Link onClick={handleCloseMenu} href="/terms" className="flex items-center hover:text-yellow-400 transition-all">
                  <Image height={40} width={40} src="/icons/pencil.svg" alt="About" className="w-6 mr-4 svg-white" />
                  Terms
                </Link>
              </li>

              <li className="text-lg capitalize">
                <Link onClick={handleCloseMenu} href="/about" className="flex items-center hover:text-yellow-400 transition-all">
                  <Image height={40} width={40} src="/icons/event.svg" alt="About" className="w-6 mr-4 svg-white" />
                  About
                </Link>
              </li>
            </ul>

            {/* Login Button */}
            <div className="mt-8">
              <button
                className="w-full bg-yellow-logo text-black font-semibold py-2 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition-all"
              >
                <Link onClick={handleCloseMenu} href={ADMIN_FRONTEND_URL}>
                  Login
                </Link>
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default PublicMenu;