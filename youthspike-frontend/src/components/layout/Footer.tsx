'use client';

import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import { EEventItem } from '@/types/event';
import { EVENT_ITEM, LDO_ID } from '@/utils/constant';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { getEvent } from '@/utils/localStorage';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function Footer() {
  const user = useUser();
  const params = useParams();
  const { ldoId, ldoIdUrl } = useLdoId();

  const [newEventId, setNewEventId] = useState<null | string>(null);
  const [newLdoUrl, setNewLdoUrl] = useState<string>('');

  useEffect(() => {
    if (params.eventId) {
      setNewEventId(params.eventId.toString());
    } else {
      const eventId = getEvent();
      if (eventId && eventId !== '') {
        setNewEventId(eventId);
      }
    }
  }, [params]);

  useEffect(() => {
    if (ldoId && ldoId !== '') {
      setNewLdoUrl(`&${LDO_ID}=${ldoId}`);
    }
  }, [ldoId]);

  return (
    <footer className="bg-black-logo text-white border-t border-gray-700">
      <div className="container mx-auto px-2 py-8">
        {/* Responsive Menu */}
        <nav className="flex flex-col md:flex-row justify-center items-center mb-4 space-y-4 md:space-y-0 md:space-x-8">
          <Link href={`/${ldoIdUrl}`} className="hover:text-gray-400 transition-colors">
            Home
          </Link>
          {user.token && (
            <Link href={ADMIN_FRONTEND_URL} className="hover:text-gray-400 transition-colors">
              Admin
            </Link>
          )}
          {newEventId && (
            <>
              <Link href={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.TEAM}${newLdoUrl}`} className="hover:text-gray-400 transition-colors">
                Teams
              </Link>
              <Link href={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.MATCH}${newLdoUrl}`} className="hover:text-gray-400 transition-colors">
                Matches
              </Link>
              <Link href={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.PLAYER}${newLdoUrl}`} className="hover:text-gray-400 transition-colors">
                Roster
              </Link>
              <Link href={`${ADMIN_FRONTEND_URL}/${newEventId}/settings/${ldoIdUrl}`} className="hover:text-gray-400 transition-colors">
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
