'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { IUser, UserRole } from '@/types/user';
import Link from 'next/link';
import { removeCookie, getCookie } from '@/utils/cookie';
import { useParams } from 'next/navigation';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { EVENT_ITEM } from '@/utils/constant';
import { EEventItem } from '@/types/event';
import { getEvent } from '@/utils/localStorage';
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
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [user, setUser] = useState<ICookieUser>(initialUser);
  const [newEventId, setNewEventId] = useState<null | string>(null);

  const params = useParams();

  const openMenuHandler = () => {
    // eslint-disable-next-line no-unused-expressions
    // user.info && user.token && user.token !== '' ? setOpenMenu(true) : setOpenMenu(false);
    setOpenMenu(true);
  };

  const closeMenuHandler = () => {
    setOpenMenu(false);
  };

  const handleLogout = (e: React.SyntheticEvent) => {
    e.preventDefault();
    removeCookie('token');
    removeCookie('user');
    return window.location.reload();
  };

  // ===== Component mount =====
  useEffect(() => {
    const instantToken = getCookie('token'); // Fetch again
    const instantInfo = getCookie('user');
    if (instantInfo && instantToken) {
      if (instantToken) {
        setUser((prevState) => ({ ...prevState, token: instantToken }));
      }
      if (instantInfo) {
        setUser((prevState) => ({ ...prevState, info: JSON.parse(instantInfo) }));
      }
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const eventId: string | null = params?.eventId || getEvent();
    setNewEventId(eventId);
  }, [params]);

  // =====  Render sub components =====
  // const renderMenuItems = () => {
  //   const eventId = params?.eventId || getEvent();

  //   let itemList = userMenuList;
  //   const instantToken = getCookie('token');
  //   if (instantToken && eventId) {
  //     itemList = [...userMenuList, ...adminMenuList];
  //   }
  //   const menuItems: React.ReactNode[] = [];
  //   for (let i = 0; i < itemList.length; i += 1) {
  //     let newLink: string = itemList[i].link;
  //     if (eventId && instantToken && itemList[i].admin) newLink = `${ADMIN_FRONTEND_URL}/${eventId}/${itemList[i].link}`;
  //     menuItems.push(<MenuItem setOpenMenu={setOpenMenu} key={itemList[i].id} icon={`/icons/${itemList[i].imgName}.svg`} text={itemList[i].text} link={newLink} />);
  //   }

  //   return menuItems;
  // };

  return (
    <div className="container px-2 mx-auto text-white">
      <button type="button" onClick={openMenuHandler} className="menu-button">
        <img src="/icons/menu.svg" className="w-10 mt-4 svg-white" alt="menu" />
      </button>

      {openMenu && (
        <div className="menu-content bg-gray-950 text-white w-5/6 md:w-3/6 absolute h-full top-0 left-0 z-30 p-4">
          <div className="w-full flex justify-end items-center">
            <button type="button" onClick={closeMenuHandler} className="close-button">
              <img src="/icons/close.svg" className="w-10 svg-white" alt="close" />
            </button>
          </div>

          {user.info && (
            <div className="user-info w-full mt-4 flex items-start justify-start flex-col">
              <h1 className="capitalize">{`${user?.info?.firstName} ${user?.info?.lastName}`}</h1>
              {user.info?.team && <h3>{user.info?.team} </h3>}
              <p className="uppercase text-yellow-400 mt-1">{user.info?.role}</p>
            </div>
          )}
          <div className="league-director w-full flex justify-between items-center mb-8">{user?.info?.role === UserRole.admin && <h1 className="text-2xl">Admin</h1>}</div>
          {params?.eventId && (
            <div className="league mb-8 w-full">
              <Link href="/" className="text-2xl">
                Event
              </Link>
            </div>
          )}
          <ul className="menu-list flex justify-start flex-col gap-8">
            <MenuItem icon="/icons/trophy.svg" link="/" setOpenMenu={setOpenMenu} text="Home" key="umi-1" />
            <MenuItem icon="/icons/teams.svg" link="/events" setOpenMenu={setOpenMenu} text="Events" key="umi-2" />
            {newEventId && (
              <>
                <MenuItem icon="/icons/matches-white.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.MATCH}`} setOpenMenu={setOpenMenu} text="Matches" key="umi-3" />
                <MenuItem icon="/icons/teams.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.TEAM}`} setOpenMenu={setOpenMenu} text="Teams" key="umi-4" />
                <MenuItem icon="/icons/players.svg" link={`/events/${newEventId}/?${EVENT_ITEM}=${EEventItem.PLAYER}`} setOpenMenu={setOpenMenu} text="Roster" key="umi-5" />
                <MenuItem icon="/icons/account.svg" link={`${ADMIN_FRONTEND_URL}/${newEventId}/settings`} setOpenMenu={setOpenMenu} text="Settings" key="umi-6" />
              </>
            )}
            {user.token && <MenuItem icon="/icons/players.svg" link={ADMIN_FRONTEND_URL} setOpenMenu={setOpenMenu} text="Admin" key="umi-5" />}
            {user && user.token && user.token !== '' && (
              <li>
                <button className="btn-danger" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Menu;
