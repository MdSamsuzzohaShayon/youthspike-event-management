'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, usePathname, useSearchParams } from 'next/navigation'
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
        console.log({token: findToken, findUser});
        // Can not set info or token if that is already exist
        if (findToken && findToken !== '' && findToken !== null && (!token || token === '')) setToken(findToken);
        if (findUser && findToken !== '' && findToken !== null && (!token || token === '')) setInfo(JSON.parse(findUser));
    }, [pathname, searchParams, token, info]);
    return (
        <UserContext.Provider value={{ info, token }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

export default UserProvider;


