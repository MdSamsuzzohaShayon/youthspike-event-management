'use client';

import { useUser } from '@/lib/UserProvider';
import { EEventItem } from '@/types/event';
import { EVENT_ITEM } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function Footer() {
  const [newEventId, setNewEventId] = useState<null | string>(null);
  const user = useUser();
  const params = useParams();

  useEffect(() => {
    if (params.eventId) {
      setNewEventId(params.eventId.toString());
    }
  }, [params]);
  return (
    <footer className="bg-black-logo text-white border-t border-gray-700">
      <div className="container mx-auto px-4 py-8">
        {/* Responsive Menu */}
        <nav className="flex flex-col md:flex-row justify-center items-center mb-4 space-y-4 md:space-y-0 md:space-x-8">
          <Link href="/" className="hover:text-gray-400 transition-colors">
            Home
          </Link>
          {user.token && (
            <Link href={ADMIN_FRONTEND_URL} className="hover:text-gray-400 transition-colors">
              Admin
            </Link>
          )}
          {newEventId && (
            <>
              <Link href={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.TEAM}`} className="hover:text-gray-400 transition-colors">
                Teams
              </Link>
              <Link href={`/matches/${newEventId}/?${EVENT_ITEM}=${EEventItem.MATCH}`} className="hover:text-gray-400 transition-colors">
                Matches
              </Link>
              <Link href={`/players/${newEventId}/?${EVENT_ITEM}=${EEventItem.PLAYER}`} className="hover:text-gray-400 transition-colors">
                Roster
              </Link>
              <Link href={`${ADMIN_FRONTEND_URL}/${newEventId}/settings`} className="hover:text-gray-400 transition-colors">
                Settings
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-600" />
      <div className="container mx-auto px-4 py-8">
        {/* Copyright Information */}
        <div className="text-center text-sm">
          <p>© 2024 American Spikers League. All Rights Reserved.</p>
          <p className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
        <br />
      </div>
    </footer>
  );
}

export default Footer;
