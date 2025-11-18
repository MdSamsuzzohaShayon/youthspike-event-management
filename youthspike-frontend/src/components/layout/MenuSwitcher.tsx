'use client';

import { IAccessCode, IUserContext } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import AdminMenu from './AdminMenu';
import PublicMenu from './PublicMenu';


interface IMenuSwitcherProps{
  accessCodeList: IAccessCode[];
}
function MenuSwitcher({accessCodeList}: IMenuSwitcherProps) {
  const pathname = usePathname();

  const [user, setUser] = useState<IUserContext | null>(null);

  useEffect(() => {
    const userDetail = getUserFromCookie();

    if (userDetail && userDetail.token) {
      setUser(userDetail);
    }
  }, [pathname]);

  return <div className="MenuSwitcher">{user ? <AdminMenu user={user} /> : <PublicMenu accessCodeList={accessCodeList} />}</div>;
}

export default MenuSwitcher;
