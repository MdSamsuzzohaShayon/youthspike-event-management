'use client'

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MenuItem from './MenuItem';
import { IUser, IUserContext, UserRole } from '@/types/user';
import { IMenuItem } from '@/types';
import { gql, useApolloClient, useLazyQuery, useReadQuery } from '@apollo/client';
import { GET_LDO } from '@/graphql/director';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import Link from 'next/link';
import { getCookie, removeCookie } from '@/utils/cookie';
import { isValidObjectId } from '@/utils/helper';

const eventPaths: string[] = ['settings', 'teams', 'players', 'matches', 'account', 'newevent', 'admin'];

const initialUserMenuList: IMenuItem[] = [
    {
        id: 8,
        imgName: 'home',
        text: 'Home',
        link: '/'
    },
    {
        id: 1,
        imgName: 'setting',
        text: 'Settings',
        link: '/settings' // // Event settings
    },
    {
        id: 2,
        imgName: 'teams',
        text: 'Teams',
        link: '/teams'
    },
    {
        id: 3,
        imgName: 'players',
        text: 'Players',
        link: '/players'
    },
    {
        id: 4,
        imgName: 'trophy',
        text: 'Matches',
        link: '/matches'
    },
    {
        id: 5,
        imgName: 'account',
        text: 'Account',
        link: '/account'
    },
    {
        id: 6,
        imgName: 'account',
        text: 'Admin',
        link: '/admin'
    },
    {
        id: 7,
        imgName: 'account',
        text: 'LDO',
        link: '/admin/directors'
    },
];

interface ICookieUser {
    info: null | IUser;
    token: null | string;
}

const initialUser = {
    info: null,
    token: null
};

function Menu() {
    /**
     * For home/ leagues page show only account option
     * Add logo to the top for league director organization
     * If user is captain show only matches and teams
     * Show setting, teams, matches, players option and event name if the user has a eventId
     * Create LDO or League Director Organization from the backend
     */
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const client = useApolloClient();
    const menuEl = useRef<HTMLDivElement | null>(null);

    const [openMenu, setOpenMenu] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [eventId, setEventId] = useState<string | null>(null);
    const [directorId, setDirectorId] = useState<string | null>(null);
    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);
    const [user, setUser] = useState<ICookieUser>(initialUser);

    const [fetchLDO, { data, error, loading }] = useLazyQuery(GET_LDO);

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
        // setIsAuthenticated(false);
        // setOpenMenu(false);
        // return router.push('/login');
        return window.location.reload();
    }

    /**
     * Using Cache
     */


    /**
     * Handle clicking outinde
     */
    const handleBodyClick = (e: MouseEvent) => {
        if (!menuEl || !menuEl.current) return;
        const menuDimentions = menuEl.current.getBoundingClientRect();

        // If i click outside of these dimensions
        if (
            e.clientX < menuDimentions.left ||
            e.clientX > menuDimentions.right ||
            e.clientY < menuDimentions.top ||
            e.clientY > menuDimentions.bottom
        ) {
            setOpenMenu(false);
        }
    }




    /**
     * Mount hooks
     */
    const hasValidUser = (): IUserContext => {
        const instantToken = getCookie('token'); // Fetch again
        const instantInfo = getCookie('user');

        if (instantInfo && instantToken) {
            if (!isAuthenticated) setIsAuthenticated(true); // 
            if (instantToken) {
                setUser((prevState) => ({ ...prevState, token: instantToken }))
            }
            if (instantInfo) {
                setUser((prevState) => ({ ...prevState, info: JSON.parse(instantInfo) }))
            }
            fetchLDO();
        }
        return {
            info: instantInfo ? JSON.parse(instantInfo) : null,
            token: instantToken ? instantToken : null
        }
    }


    useEffect(() => {
        // Effect
        const userDetail = hasValidUser();

        // Check path has event Id or not
        const pathList = pathname.split('/');
        let eventPath = pathList.length > 0 ? pathList[1] : null;
        let isValidId = eventPath ? isValidObjectId(eventPath) : false;
        if (eventPath && eventPaths.includes(eventPath)) isValidId = false;

        if (!eventPath || !isValidId) {
            setEventId(null);
            if (userDetail.info?.role === UserRole.admin) {
                const newDirectorId = searchParams.get("directorId");
                if (newDirectorId) setDirectorId(newDirectorId);
                setUserMenuList([...initialUserMenuList.filter((menuItem) => menuItem.id === 6 || menuItem.id === 7)]); // Admin and directors
            } else if (userDetail.info?.role === UserRole.captain) {
                setUserMenuList([...initialUserMenuList.filter((menuItem) => menuItem.id === 3 || menuItem.id === 4)]); // captain
            } else {
                setUserMenuList([...initialUserMenuList.filter((menuItem) => menuItem.id === 5 || menuItem.id === 8)]); // 5 = account
            }
        } else {
            setEventId(eventPath);
            if (userDetail.info?.role === UserRole.director) {
                // console.log(initialUserMenuList.filter((menuItem) => menuItem.id !== 6 && menuItem.id !== 7));
                setUserMenuList((prevState) => [...initialUserMenuList.filter((menuItem) => menuItem.id !== 6 && menuItem.id !== 7)]); // 2 = teams // 4 = matches
                setDirectorId(userDetail.info._id);
            } else if (userDetail.info?.role === UserRole.captain) {
                setUserMenuList([...initialUserMenuList.filter((menuItem) => menuItem.id === 3 || menuItem.id === 4 || menuItem.id === 1)]); // captain
            } else {
                setUserMenuList(initialUserMenuList);
            }
        }

    }, [router, pathname]);


    const makeMenuLink=(url: string)=>{
        let baseUrl = url;
        if(user.info?.role === UserRole.admin && directorId) `${baseUrl}/?directorId=${directorId}`;
        return baseUrl;
    }




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

    /**
     * Renders sub components
     */
    const renderMenuItems = (eId: string | null, uml: IMenuItem[]) => {
        const menuItems: React.ReactNode[] = [];
        for (let i = 0; i < uml.length; i++) {
            let newLink: string = '';
            if (eId && eId !== '' && (uml[i].id === 1 || uml[i].id === 2 || uml[i].id === 3 || uml[i].id === 4)) newLink = '/' + eId;
            menuItems.push(<MenuItem setOpenMenu={setOpenMenu} key={uml[i].id} icon={`/icons/${uml[i].imgName}.svg`} text={uml[i].text} link={makeMenuLink(`${newLink}${uml[i].link}`)} />);
        }

        return <>{menuItems}</>;
    }

    // if (!user.info || !user.token || user.token === '') return null;

    return (
        <div className='container px-2 mx-auto'>
            {isAuthenticated && (
                <button onClick={openMenuHandler} className='menu-button'>
                    <img src='/icons/menu.svg' className='w-10 mt-4 svg-white' alt='menu' />
                </button>
            )}

            {openMenu && (
                <div className="menu-content bg-gray-700 w-5/6 md:w-3/6 absolute h-full top-0 left-0 z-20 p-4" ref={menuEl}>
                    <div className="w-full flex justify-end items-center">
                        <button onClick={closeMenuHandler} className='close-button'>
                            <img src='/icons/close.svg' className='w-10 svg-white' alt='close' />
                        </button>
                    </div>
                    <div className="user-info w-full mt-4 flex items-start justify-start flex-col">
                        <h1 className='capitalize'>{`${user?.info?.firstName} ${user?.info?.lastName}`}</h1>
                        <p className='uppercase text-yellow-500 mt-1'>{user.info?.role}</p>
                        <br />
                    </div>
                    {/* <div className="league-director w-full flex justify-between items-center mb-8">
                        {user && user.info && user.info.role === UserRole.admin ? (<h1 className='text-2xl'>Admin</h1>) : (<>
                            <Link role="presentation" onClick={closeMenuHandler} href="/">
                                {ldoData?.logo ? <AdvancedImage className="w-2/6" cldImg={cld.image(ldoData?.logo)} /> : <img src="/free-logo.svg" alt="spikeball-logo" className="w-2/6" />}
                            </Link>
                            <h1 className='text-2xl'>{ldoData ? ldoData.name : ''}</h1>
                        </>)}
                    </div> */}
                    {eventId && (
                        <div className="league mb-8 w-full">
                            <Link href="/" className='text-2xl font-bold'>Event </Link>
                        </div>
                    )}
                    <ul className='menu-list flex justify-start flex-col gap-8'>
                        {renderMenuItems(eventId, userMenuList)}
                        {(user && user.token && user.token !== '') && <li><button className="btn-danger" type='button' onClick={handleLogout}>Logout</button></li>}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Menu;