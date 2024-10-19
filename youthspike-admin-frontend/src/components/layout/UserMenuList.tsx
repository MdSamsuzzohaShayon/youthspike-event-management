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
import { useLdoId } from '@/lib/LdoProvider';

const {initial: iInitial, animate: iAnimate, exit: iExit, transition: iTransition} = liAnimate;

function UserMenuList({ eventId }: { eventId: string }) {
    const pathname = usePathname();
    const {ldoIdUrl} = useLdoId();
    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);
    

    useEffect(() => {
        const userDetail = getUserFromCookie();
        // Get ldoId from query parameters and set state
        const eventPath = getEventIdFromPath(pathname);
        let menuItemList = rearrangeMenu(userDetail, eventPath);
        
        menuItemList = menuItemList.map((mi) => ({ ...mi, link: mi.id === 5 ? mi.link : `/${eventId}/${mi.link}/${ldoIdUrl}` }));
        setUserMenuList(menuItemList);
    }, [pathname]);

    // State to hold ldoId


    return (
        <ul className="w-full flex justify-center items-center gap-x-2 flex-wrap">
            {userMenuList.map((item, iIdx) => (
                <motion.li className='capitalize' initial={iInitial} animate={iAnimate} exit={iExit} transition={iTransition} key={item.id}>
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
