import { IMenuItem } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { getEventIdFromPath, rearrangeMenu } from '@/utils/helper';
import { initialUserMenuList } from '@/utils/staticData';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function UserMenuList({eventId}: {eventId: string}) {

    const pathname = usePathname();

    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);

    useEffect(() => {
        // ===== Set Menu Items =====
        const userDetail = getUserFromCookie();
        if (userDetail) {
            // ===== Check path has event Id or not
            const eventPath = getEventIdFromPath(pathname);
            const menuItemList = rearrangeMenu(userDetail, eventPath);
            setUserMenuList(menuItemList);
        }

    }, []);
    return (
        <ul className="w-full flex justify-center items-center gap-x-2 flex-wrap">
            {userMenuList.map((item, iIdx) => <li key={item.id}> <Link href={item.id === 8 || item.id === 5 ? `${item.link}` : `/${eventId}${item.link}`} >{iIdx !== 0 && "|"} {item.text}</Link></li>)}
        </ul>
    )
}

export default UserMenuList;