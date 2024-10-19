'use client'

import React, { Context, createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserProvider';
import { useSearchParams } from 'next/navigation';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';

// Create a context that holds both ldoIdUrl and ldoId
interface LdoContextType {
    ldoIdUrl: string;
    ldoId: string | null;
}

export const LdoContext = createContext<LdoContextType>({
    ldoIdUrl: "",
    ldoId: null,
});

export function useLdoId() {
    return useContext(LdoContext);
}

function LdoProvider({ children }: React.PropsWithChildren) {
    const user = useUser();
    const searchParams = useSearchParams();
    const [ldoIdUrl, setLdoIdUrl] = useState<string>("");
    const [ldoId, setLdoId] = useState<string | null>(null);

    useEffect(() => {
        if (user.info?.role === UserRole.admin || user.info?.role === UserRole.director) {
            const ldoIdFromUrl = searchParams.get(LDO_ID);
            if (ldoIdFromUrl) {
                setLdoId(ldoIdFromUrl.toString());
                setLdoIdUrl(`?${LDO_ID}=${ldoIdFromUrl}`);
            }
        }
    }, [user, searchParams]);

    return (
        <LdoContext.Provider value={{ ldoIdUrl, ldoId }}>
            {children}
        </LdoContext.Provider>
    );
}

export default LdoProvider;
