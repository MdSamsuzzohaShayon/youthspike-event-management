import { IMenuItem } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { getEventIdFromPath, rearrangeMenu } from '@/utils/helper';
import { initialUserMenuList } from '@/utils/staticData';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function UserMenuList({ eventId }: { eventId: string }) {
    const pathname = usePathname();
    const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);

    useEffect(() => {
        const userDetail = getUserFromCookie();
        if (userDetail) {
            const eventPath = getEventIdFromPath(pathname);
            const menuItemList = rearrangeMenu(userDetail, eventPath);
            setUserMenuList(menuItemList);
        }

        // Get ldoId from query parameters and set state
        const searchParams = new URLSearchParams(location.search);
        const ldoIdParam = searchParams.get('ldoId');

        if (ldoIdParam) {
            setLdoId(ldoIdParam);
        }
    }, [pathname]);

    // State to hold ldoId
    const [ldoId, setLdoId] = useState<string | null>(null);

    return (
        <ul className="w-full flex justify-center items-center gap-x-2 flex-wrap">
            {userMenuList.map((item, iIdx) => (
                <li key={item.id}>
                    <Link
                        href={{
                            pathname:
                                item.id === 8 || item.id === 5 ? item.link : `/${eventId}${item.link}`,
                            // query: { ldoId }, // Include ldoId in query parameters
                        }}
                    >
                        {iIdx !== 0 && '|'} {item.text}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default UserMenuList;
