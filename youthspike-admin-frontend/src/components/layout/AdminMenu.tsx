'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFromCookie, removeCookie } from '@/utils/cookie';
import { IUserContext } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import { UserRole } from '@/types/user';
import Image from 'next/image';
import { removeDivisionFromStore, removeTeamFromStore } from '@/utils/localStorage';
import Link from 'next/link';
import { itemVariants } from '@/utils/animation';

const menuBackdropVariants = {
    visible: { opacity: 1, transition: { duration: 0.3 } },
    hidden: { opacity: 0, transition: { duration: 0.3 } },
};

const menuVariants = {
    hidden: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
    visible: { x: '0', opacity: 1, transition: { duration: 0.3 } },
    exit: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
};

const AdminMenu = () => {
    // ===== Hooks =====
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { ldoIdUrl } = useLdoId();

    // ===== Local State =====
    const [eventId, setEventId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [user, setUser] = useState<IUserContext | null>(null);


    const handleLogout = (e: React.SyntheticEvent) => {
        e.preventDefault();
        removeCookie('token');
        removeCookie('user');
        removeDivisionFromStore();
        removeTeamFromStore();
        return window.location.reload();
    }

    // ===== Component Mount =====
    useEffect(() => {
        if (params.eventId) {
            // @ts-ignore
            setEventId(params.eventId);
        } else {
            setEventId(null);
        }
        const userDetail = getUserFromCookie();

        if (userDetail && userDetail.token) {
            setUser(userDetail);
        }

    }, [params, router, pathname]);

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
        <div className="container mx-auto px-4">
            {/* Open Menu Button */}
            <button
                onClick={() => setIsMenuOpen(true)}
                className="menu-button rounded-md"
            >
                <img src="/icons/menu.svg" alt="Open Menu" className="w-10 mt-4 svg-white" />
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-60 z-40"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={menuBackdropVariants}
                        onClick={handleCloseMenu}
                    />
                )}
            </AnimatePresence>

            {/* Menu Content */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        ref={menuRef}
                        className="menu-content bg-gray-900 w-4/5 md:w-2/5 absolute min-h-full max-h-screen top-0 left-0 z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={menuVariants}
                    >
                        {/* Close Button */}
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleCloseMenu}
                                className="close-button focus:outline-none"
                            >
                                <img src="/icons/close.svg" alt="Close Menu" className="w-8 svg-white" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="user-info text-center mb-8">
                            <Link onClick={() => setIsMenuOpen(false)} href="/">
                                <Image
                                    height={100}
                                    width={100}
                                    src="/free-logo.png"
                                    alt="User Avatar"
                                    className="w-16 h-16 mx-auto rounded-full border-2 border-yellow"
                                />
                            </Link>

                            <h1 className="text-2xl text-yellow mt-4 capitalize">{`${user.info?.firstName} ${user.info?.lastName}`}</h1>
                            {user.info?.team && <h3 className="text-sm text-yellow-500 text-gray-400">{user.info.team}</h3>}
                            <p className="uppercase text-yellow text-sm mt-2">{user?.info?.role}</p>
                        </div>

                        {/* Menu Links */}
                        <ul className="menu-list space-y-6 ">
                            {user.info?.role === UserRole.admin || user.info?.role === UserRole.director && (
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href="/"
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/home.svg" alt="Home" className="w-6 mr-4 svg-white" />
                                        Home
                                    </Link>
                                </motion.li>
                            )}
                            {eventId && (<>
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href={`/${eventId}/settings/${ldoIdUrl}`}
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/setting.svg" alt="Settings" className="w-6 mr-4 svg-white" />
                                        Settings
                                    </Link>
                                </motion.li>
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href={`/${eventId}/teams/${ldoIdUrl}`}
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/teams.svg" alt="Teams" className="w-6 mr-4 svg-white" />
                                        Teams
                                    </Link>
                                </motion.li>
                                {user.info?.role === UserRole.admin || user.info?.role === UserRole.director && (
                                    <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                        <Link onClick={() => setIsMenuOpen(false)}
                                            href={`/${eventId}/groups/${ldoIdUrl}`}
                                            className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                        >
                                            <img src="/icons/group.svg" alt="Groups" className="w-6 mr-4 svg-white" />
                                            Groups
                                        </Link>
                                    </motion.li>
                                )}
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href={`/${eventId}/players/${ldoIdUrl}`}
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/players.svg" alt="Roster" className="w-6 mr-4 svg-white" />
                                        Roster
                                    </Link>
                                </motion.li>
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href={`/${eventId}/matches/${ldoIdUrl}`}
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/trophy.svg" alt="Matches" className="w-6 mr-4 svg-white" />
                                        Matches
                                    </Link>
                                </motion.li>
                            </>)}

                            {user?.info?.role === UserRole.director && (
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href="/account"
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/account.svg" alt="Account" className="w-6 mr-4 svg-white" />
                                        Account
                                    </Link>
                                </motion.li>
                            )}

                            {user?.info?.role === UserRole.admin && (<>
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href="/admin"
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/account.svg" alt="Admin" className="w-6 mr-4 svg-white" />
                                        Admin
                                    </Link>
                                </motion.li>
                                <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={() => setIsMenuOpen(false)}
                                        href="/admin/directors"
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/account.svg" alt="Admin" className="w-6 mr-4 svg-white" />
                                        LDOs
                                    </Link>
                                </motion.li>
                                {/* <motion.li variants={itemVariants} whileHover="hover" className="text-lg capitalize">
                                    <Link onClick={()=> setIsMenuOpen(false)}
                                        href="/events/tournament"
                                        className="flex items-center text-yellow hover:text-yellow-500 transition-all"
                                    >
                                        <img src="/icons/event.svg" alt="Tournament" className="w-6 mr-4 svg-white" />
                                        Tournament
                                    </Link>
                                </motion.li> */}
                            </>)}
                        </ul>

                        {/* Logout Button */}
                        <div className='mt-auto pt-4'>
                            <button
                                onClick={handleLogout}
                                className="btn-danger mt-10 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-md text-center w-full transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMenu;
