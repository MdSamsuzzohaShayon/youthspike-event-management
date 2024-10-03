import { IMenuItem } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { getEventIdFromPath, rearrangeMenu } from '@/utils/helper';
import { initialUserMenuList } from '@/utils/staticData';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { UserRole } from '@/types/user';

import { motion } from 'framer-motion';
import { liAnimate } from '@/utils/animation';

const {initial: iInitial, animate: iAnimate, exit: iExit, transition: iTransition} = liAnimate;

function UserMenuList({ eventId }: { eventId: string }) {
    const pathname = usePathname();
    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);
    const [ldoId, setLdoId] = useState<string | null>(null);
    

    useEffect(() => {
        const userDetail = getUserFromCookie();

        // Get ldoId from query parameters and set state
        const searchParams = new URLSearchParams(location.search);
        const ldoIdParam = searchParams.get('ldoId') || '';
        
        if (userDetail) {
            const eventPath = getEventIdFromPath(pathname);
            let menuItemList = rearrangeMenu(userDetail, eventPath);
            
            if (userDetail.info?.role === UserRole.admin && ldoIdParam) {
                menuItemList = menuItemList.map((mi) => ({ ...mi, link: mi.id >= 5 ? `${mi.link}${mi.id > 5 ? "" : "?ldoId=" + ldoIdParam}` : `/${eventId}/${mi.link}?ldoId=${ldoIdParam}` }));
            }else{
                menuItemList = menuItemList.map((mi) => ({ ...mi, link: mi.id === 5 ? mi.link : `/${eventId}/${mi.link}` }));
            }
            setUserMenuList(menuItemList);
        }



        if (ldoIdParam) {
            setLdoId(ldoIdParam);
        }
    }, [pathname]);

    // State to hold ldoId


    return (
        <ul className="w-full flex justify-center items-center gap-x-2 flex-wrap">
            {userMenuList.map((item, iIdx) => (
                <motion.li initial={iInitial} animate={iAnimate} exit={iExit} transition={iTransition} key={item.id}>
                    <Link
                        href={item.link}
                    >
                        {iIdx !== 0 && '|'} {item.text}
                    </Link>
                </motion.li>
            ))}
        </ul>
    );
}

export default UserMenuList;
