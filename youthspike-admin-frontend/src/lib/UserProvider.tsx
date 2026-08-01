'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation'
import { IUser, IUserContext } from '@/types/user';
import { getCookie } from '@/utils/clientCookie';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';

export const UserContext = createContext<IUserContext>({ token: null, info: null });



function UserProvider({ children }: React.PropsWithChildren) {
    const pathname = usePathname();
    const searchParams = useParams();
    
    const [token, setToken] = useState<string | null>(null);
    const [info, setInfo] = useState<IUser | null>(null);

    useEffect(() => {
        const findToken = getCookie('token');
        const findUser = getCookie('user');

        const currentEvent = SessionStorageService.getItem(CURRENT_EVENT);
        if(!currentEvent){
            SessionStorageService.setItem(CURRENT_EVENT, "6a3c355236b002d89afc4a49"); // temp
        }
        // console.log({token: findToken, findUser});
        // Can not set info or token if that is already exist
        if (findToken && findToken !== '' && findToken !== null && (!token || token === '')) setToken(findToken);
        if (findUser && findUser !== '' && findUser!== null && (!info)) setInfo(JSON.parse(findUser));
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


