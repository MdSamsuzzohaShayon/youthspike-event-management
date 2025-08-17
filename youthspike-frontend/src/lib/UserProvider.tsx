'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { getCookie } from '@/utils/cookie';
import { IUser, IUserContext } from '@/types/user';

export const UserContext = createContext<IUserContext>({ token: null, info: null });

function UserProvider({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useParams();

  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<IUser | null>(null);

  useEffect(() => {
    const findToken = getCookie('token');
    const findUser = getCookie('user');

    // Can not set info or token if that is already exist
    if (findToken && findToken !== '' && findToken !== null && (!token || token === '')) setToken(findToken);
    if (findUser && findToken !== '' && findToken !== null && (!token || token === '')) setInfo(JSON.parse(findUser));
  }, [pathname, searchParams, token, info]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ token, info }), [token, info]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

export default UserProvider;