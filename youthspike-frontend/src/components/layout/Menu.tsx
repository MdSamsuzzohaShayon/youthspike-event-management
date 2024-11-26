'use client';

import React, { useState, useEffect } from 'react';
import { IUser } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { removeCookie, getCookie } from '@/utils/cookie';
import { useParams } from 'next/navigation';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { EVENT_ITEM, LDO_ID } from '@/utils/constant';
import { EEventItem } from '@/types/event';
import { getEvent } from '@/utils/localStorage';
import { motion } from 'framer-motion';
import MenuItem from './MenuItem';

interface ICookieUser {
  info: null | IUser;
  token: null | string;
}

const initialUser = {
  info: null,
  token: null,
};

function Menu() {
  const params = useParams();
  const { ldoId, ldoIdUrl } = useLdoId();

  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [user, setUser] = useState<ICookieUser>(initialUser);
  const [newEventId, setNewEventId] = useState<null | string>(null);
  const [newLdoUrl, setNewLdoUrl] = useState<string>('');

  const handleLogout = (e: React.SyntheticEvent) => {
    e.preventDefault();
    removeCookie('token');
    removeCookie('user');
    return window.location.reload();
  };

  useEffect(() => {
    const instantToken = getCookie('token');
    const instantInfo = getCookie('user');
    if (instantInfo && instantToken) {
      if (instantToken) setUser((prevState) => ({ ...prevState, token: instantToken }));
      if (instantInfo) setUser((prevState) => ({ ...prevState, info: JSON.parse(instantInfo) }));
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const eventId: string | null = params?.eventId || getEvent();
    setNewEventId(eventId);
  }, [params]);

  useEffect(() => {
    if (ldoId && ldoId !== '') setNewLdoUrl(`&${LDO_ID}=${ldoId}`);
  }, [ldoId]);

  return (
    <div className="relative text-white">
      {/* Menu Button */}
      <div className="container mx-auto px-4">
        <button type="button" onClick={() => setOpenMenu(true)} className="p-2 focus:outline-none">
          <img src="/icons/menu.svg" className="w-8 h-8 svg-white" alt="menu" />
        </button>
      </div>

      {/* Menu Content */}
      {openMenu && (
        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.4, ease: 'easeInOut' }} className="fixed inset-0 z-40 bg-gray-950 text-white">
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h1 className="text-lg font-bold">Menu</h1>
            <button type="button" onClick={() => setOpenMenu(false)} className="p-2 focus:outline-none">
              <img src="/icons/close.svg" className="w-8 h-8 svg-white" alt="close" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* User Info */}
            {user.info && (
              <div className="flex flex-col items-start space-y-2">
                <h2 className="text-xl font-semibold capitalize">{`${user.info.firstName} ${user.info.lastName}`}</h2>
                {user.info.team && <h3 className="text-sm text-gray-400">{user.info.team}</h3>}
                <p className="text-sm uppercase text-yellow-400">{user.info.role}</p>
              </div>
            )}

            {/* Navigation Links */}
            <ul className="space-y-4">
              <MenuItem icon="/icons/trophy.svg" link={`/${ldoIdUrl}`} setOpenMenu={setOpenMenu} text="Home" key="umi-1" />
              <MenuItem icon="/icons/teams.svg" link="/events" setOpenMenu={setOpenMenu} text="Events" key="umi-2" />
              {newEventId && (
                <>
                  <MenuItem icon="/icons/matches-white.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.MATCH}${newLdoUrl}`} setOpenMenu={setOpenMenu} text="Matches" key="umi-3" />
                  <MenuItem icon="/icons/teams.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.TEAM}${newLdoUrl}`} setOpenMenu={setOpenMenu} text="Teams" key="umi-4" />
                  <MenuItem icon="/icons/players.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.PLAYER}${newLdoUrl}`} setOpenMenu={setOpenMenu} text="Roster" key="umi-5" />
                  <MenuItem icon="/icons/account.svg" link={`${ADMIN_FRONTEND_URL}/${newEventId}/settings/${ldoIdUrl}`} setOpenMenu={setOpenMenu} text="Settings" key="umi-6" />
                </>
              )}
              {user.token && <MenuItem icon="/icons/players.svg" link={ADMIN_FRONTEND_URL} setOpenMenu={setOpenMenu} text="Admin" key="umi-7" />}
            </ul>

            {/* Logout Button */}
            {user.token && (
              <button type="button" onClick={handleLogout} className="w-full py-2 text-left text-red-500 hover:underline">
                Logout
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Menu;
