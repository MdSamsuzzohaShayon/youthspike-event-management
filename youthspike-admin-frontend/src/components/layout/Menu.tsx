'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname} from 'next/navigation';
import MenuItem from './MenuItem';
import { IUser } from '@/types/user';
import { IMenuItem } from '@/types';
import { useLazyQuery } from '@apollo/client';
import { GET_LDO } from '@/graphql/director';
import Link from 'next/link';
import { getCookie, getUserFromCookie, removeCookie } from '@/utils/cookie';
import { getEventIdFromPath, isValidObjectId, rearrangeMenu } from '@/utils/helper';
import { FRONTEND_URL } from '@/utils/keys';
import { removeDivisionFromStore, removeTeamFromStore } from '@/utils/localStorage';
import { initialUserMenuList } from '@/utils/staticData';

import { motion } from 'framer-motion';
import { menuAnimate } from '@/utils/animation';
import { useLdoId } from '@/lib/LdoProvider';

const {initial: mInitial, animate: mAnimate, exit: mExit, transition: mTransition} = menuAnimate;





interface ICookieUser {
    info: null | IUser;
    token: null | string;
}

const initialUser = {
    info: null,
    token: null
};

function Menu() {
    // ===== Hooks =====
    const router = useRouter();
    const pathname = usePathname();
    const {ldoIdUrl} = useLdoId();
    
    // ===== Local State =====
    const [openMenu, setOpenMenu] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [eventId, setEventId] = useState<string | null>(null);
    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);
    const [user, setUser] = useState<ICookieUser>(initialUser);
    const menuEl = useRef<HTMLDivElement | null>(null);

    // ===== GraphQL =====
    const [fetchLDO, { data, error, loading }] = useLazyQuery(GET_LDO);

    // ===== Event Handlers =====
    const openMenuHandler = () => {
        user.info && user.token && user.token !== '' ? setOpenMenu(true) : setOpenMenu(false);
    };

    const closeMenuHandler = () => {
        setOpenMenu(false);
    };


    const handleLogout = (e: React.SyntheticEvent) => {
        e.preventDefault();
        removeCookie('token');
        removeCookie('user');
        removeDivisionFromStore();
        removeTeamFromStore();
        return window.location.reload();
    }

    const handleBodyClick = (e: MouseEvent) => {
        if (!menuEl || !menuEl.current) return;
        const menuDimentions = menuEl.current.getBoundingClientRect();
        if (
            e.clientX < menuDimentions.left ||
            e.clientX > menuDimentions.right ||
            e.clientY < menuDimentions.top ||
            e.clientY > menuDimentions.bottom
        ) {
            setOpenMenu(false);
        }
    }



    // ===== Component Mount =====
    useEffect(() => {
        const userDetail = getUserFromCookie();

        if (userDetail && userDetail.token) {
            if (!isAuthenticated) setIsAuthenticated(true);
            setUser({ token: userDetail.token, info: userDetail.info });
            fetchLDO();
            // ===== Check path has event Id or not
            const eventPath = getEventIdFromPath(pathname);
            setEventId(eventPath);

            const menuItemList = rearrangeMenu(userDetail, eventPath);
            setUserMenuList(menuItemList);
        }

    }, [router, pathname]);

    useEffect(() => {
        const bodyEl = document.getElementsByTagName('body');
        if (bodyEl && bodyEl.length > 0) {
            const bodyFEl = bodyEl[0];
            bodyFEl.addEventListener('click', handleBodyClick, { passive: false });
            return () => {
                bodyFEl.removeEventListener("click", handleBodyClick);
            }
        }
    }, []);

    // ===== Runder sub components =====
    const renderMenuItems = (eId: string | null, uml: IMenuItem[]) => {
        
        const menuItems: React.ReactNode[] = [];
        for (let i = 0; i < uml.length; i++) {
            let newLink: string = '';
            if (eId && eId !== '' && (uml[i].id === 1 || uml[i].id === 2 || uml[i].id === 2.5 || uml[i].id === 3 || uml[i].id === 4)) {
                newLink = '/' + eId;
            } else if (eId && eId !== '' && (uml[i].id === 9)) {
                newLink = `${FRONTEND_URL}/events/${eId}`;
            }

            const reformattedURL = `${newLink}${uml[i].link}/${uml[i].id !== 7 || uml[i].id !== 8 ? ldoIdUrl : ""}`;
            
            menuItems.push(<MenuItem setOpenMenu={setOpenMenu} key={uml[i].id} icon={`/icons/${uml[i].imgName}.svg`} text={uml[i].text}
                link={reformattedURL} />);

        }

        return <>{menuItems}</>;
    }

    return (
        <div className='container px-2 mx-auto'>
            {isAuthenticated && (
                <button onClick={openMenuHandler} className='menu-button'>
                    <img src='/icons/menu.svg' className='w-10 mt-4 svg-white' alt='menu' />
                </button>
            )}

            {openMenu && (
                <motion.div initial={mInitial} animate={mAnimate} exit={mExit} transition={mTransition} className="menu-content bg-gray-700 w-5/6 md:w-3/6 absolute min-h-full top-0 left-0 z-20 p-4" ref={menuEl}>
                    <div className="w-full flex justify-end items-center">
                        <button onClick={closeMenuHandler} className='close-button'>
                            <img src='/icons/close.svg' className='w-10 svg-white' alt='close' />
                        </button>
                    </div>
                    <div className="user-info w-full mt-4 flex items-start justify-start flex-col">
                        <h1 className='capitalize'>{`${user?.info?.firstName} ${user?.info?.lastName}`}</h1>
                        {user.info?.team && <h3>{user.info?.team} </h3>}
                        <p className='uppercase text-yellow-logo mt-1'>{user.info?.role}</p>
                        <br />
                    </div>
                    <Link href="/" className='text-2xl font-bold'>Home </Link>
                    <ul className='menu-list flex justify-start flex-col gap-8'>
                        {renderMenuItems(eventId, userMenuList)}
                        {(user && user.token && user.token !== '') && <li><button className="btn-danger" type='button' onClick={handleLogout}>Logout</button></li>}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}

export default Menu;