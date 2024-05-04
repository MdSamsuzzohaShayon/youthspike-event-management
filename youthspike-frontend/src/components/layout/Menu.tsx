'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { IUser, UserRole } from '@/types/user';
import { IMenuItem } from '@/types';
import Link from 'next/link';
import { removeCookie, getCookie } from '@/utils/cookie';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import MenuItem from './MenuItem';

const initialUserMenuList: IMenuItem[] = [
  {
    id: 1,
    imgName: 'trophy',
    text: 'Home',
    link: '/', // // Event settings
  },
  {
    id: 2,
    imgName: 'teams',
    text: 'Events',
    link: '/events',
  },
  {
    id: 3,
    imgName: 'setting',
    text: 'Dashboard',
    link: '/dashboard',
  },
];

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
  const [eventId, setEventId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);
  const [user, setUser] = useState<ICookieUser>(initialUser);

  const openMenuHandler = () => {
    // eslint-disable-next-line no-unused-expressions
    user.info && user.token && user.token !== '' ? setOpenMenu(true) : setOpenMenu(false);
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
      setIsAuthenticated(true);
      if (instantToken) {
        setUser((prevState) => ({ ...prevState, token: instantToken }));
      }
      if (instantInfo) {
        setUser((prevState) => ({ ...prevState, info: JSON.parse(instantInfo) }));
      }
    }
  }, []);

  // =====  Render sub components =====
  const renderMenuItems = (eId: string | null, uml: IMenuItem[]) => {
    // uml = user menu list
    const menuItems: React.ReactNode[] = [];
    for (let i = 0; i < uml.length; i+=1) {
      let newLink: string = '';
      if (eId && eId !== '' && (uml[i].id === 1 || uml[i].id === 2 || uml[i].id === 3 || uml[i].id === 4)) newLink = `/${eId}`;
      menuItems.push(
        <MenuItem setOpenMenu={setOpenMenu} key={uml[i].id} icon={`/icons/${uml[i].imgName}.svg`} text={uml[i].text} link={uml[i].id === 3 ? ADMIN_FRONTEND_URL : `${newLink}${uml[i].link}`} />,
      );
    }

    return menuItems;
  };

  return (
    <div className="container px-2 mx-auto text-gray-100">
      {isAuthenticated && (
        <button type="button" onClick={openMenuHandler} className="menu-button">
          <img src="/icons/menu.svg" className="w-10 mt-4 svg-white" alt="menu" />
        </button>
      )}

      {openMenu && (
        <div className="menu-content bg-gray-950 text-gray-100 w-5/6 md:w-3/6 absolute h-full top-0 left-0 z-30 p-4">
          <div className="w-full flex justify-end items-center">
            <button type="button" onClick={closeMenuHandler} className="close-button">
              <img src="/icons/close.svg" className="w-10 svg-white" alt="close" />
            </button>
          </div>

          <div className="user-info w-full mt-4 flex items-start justify-start flex-col">
            <h1 className="capitalize">{`${user?.info?.firstName} ${user?.info?.lastName}`}</h1>
            {user.info?.team && <h3>{user.info?.team} </h3>}
            <p className="uppercase text-yellow-400 mt-1">{user.info?.role}</p>
          </div>
          <div className="league-director w-full flex justify-between items-center mb-8">{user?.info?.role === UserRole.admin && <h1 className="text-2xl">Admin</h1>}</div>
          {eventId && (
            <div className="league mb-8 w-full">
              <Link href="/" className="text-2xl">
                Event
              </Link>
            </div>
          )}
          <ul className="menu-list flex justify-start flex-col gap-8">
            {renderMenuItems(eventId, userMenuList)}
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
