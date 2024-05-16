'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { IUser, UserRole } from '@/types/user';
import { IMenuItem } from '@/types';
import Link from 'next/link';
import { getEvent } from '@/utils/localStorage';
import { removeCookie, getCookie } from '@/utils/cookie';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import { useParams } from 'next/navigation';
import MenuItem from './MenuItem';

const userMenuList: IMenuItem[] = [
  {
    id: 1,
    imgName: 'trophy',
    text: 'Home',
    link: '/', // // Event settings
    admin: false,
  },
  {
    id: 2,
    imgName: 'teams',
    text: 'Events',
    link: '/events',
    admin: false,
  },
];

const adminMenuList: IMenuItem[] = [
  {
    id: 4,
    imgName: 'matches-white',
    text: 'Matches',
    link: '/matches', // // Event settings
    admin: true,
  },
  {
    id: 5,
    imgName: 'teams',
    text: 'Teams',
    link: '/teams', // // Event settings
    admin: true,
  },
  {
    id: 6,
    imgName: 'players',
    text: 'Players',
    link: '/players', // // Event settings
    admin: true,
  },
  {
    id: 7,
    imgName: 'setting',
    text: 'Settings',
    link: '/settings',
    admin: true,
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<ICookieUser>(initialUser);

  const params = useParams();

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
  const renderMenuItems = () => {
    const eventId = params?.eventId || getEvent() ;
    
    let itemList = userMenuList;
    const instantToken = getCookie('token');
    if (instantToken && eventId) {
      itemList = [...userMenuList, ...adminMenuList];
    }
    const menuItems: React.ReactNode[] = [];
    for (let i = 0; i < itemList.length; i += 1) {
      let newLink: string = itemList[i].link;
      if (eventId && instantToken && itemList[i].admin) newLink = `${ADMIN_FRONTEND_URL}/${eventId}/${itemList[i].link}`;
      menuItems.push(<MenuItem setOpenMenu={setOpenMenu} key={itemList[i].id} icon={`/icons/${itemList[i].imgName}.svg`} text={itemList[i].text} link={newLink} />);
    }

    return menuItems;
  };

  return (
    <div className="container px-2 mx-auto text-white">
      {isAuthenticated && (
        <button type="button" onClick={openMenuHandler} className="menu-button">
          <img src="/icons/menu.svg" className="w-10 mt-4 svg-white" alt="menu" />
        </button>
      )}

      {openMenu && (
        <div className="menu-content bg-gray-950 text-white w-5/6 md:w-3/6 absolute h-full top-0 left-0 z-30 p-4">
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
          {params?.eventId && (
            <div className="league mb-8 w-full">
              <Link href="/" className="text-2xl">
                Event
              </Link>
            </div>
          )}
          <ul className="menu-list flex justify-start flex-col gap-8">
            {renderMenuItems()}
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
