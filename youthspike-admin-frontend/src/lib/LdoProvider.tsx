'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserProvider';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import SessionStorageService from '@/utils/SessionStorageService';

interface LdoContextType {
    ldoIdUrl: string;
    ldoId: string | null;
}

export const LdoContext = createContext<LdoContextType>({
    ldoIdUrl: '',
    ldoId: null,
});

export function useLdoId() {
    return useContext(LdoContext);
}

function LdoProvider({ children }: React.PropsWithChildren) {
    const user = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [ldoIdUrl, setLdoIdUrl] = useState('');
    const [ldoId, setLdoId] = useState<string | null>(null);

    useEffect(() => {
        if (
            user.info?.role !== UserRole.admin &&
            user.info?.role !== UserRole.director
        ) {
            return;
        }

        const ldoIdFromUrl = searchParams.get(LDO_ID);
        const storedLdoId = SessionStorageService.getItem(LDO_ID);

        if (ldoIdFromUrl) {
            setLdoId(ldoIdFromUrl);
            setLdoIdUrl(`?${LDO_ID}=${ldoIdFromUrl}`);
            return;
        }

        if (storedLdoId) {
            const ldoIdValue = String(storedLdoId);

            setLdoId(ldoIdValue);
            setLdoIdUrl(`?${LDO_ID}=${ldoIdValue}`);

            // Preserve existing query params
            const params = new URLSearchParams(searchParams.toString());
            params.set(LDO_ID, ldoIdValue);

            router.replace(`${pathname}?${params.toString()}`);
            return;
        }

        setLdoId(null);
        setLdoIdUrl('');
    }, [user.info?.role, pathname, router, searchParams]);

    return (
        <LdoContext.Provider value={{ ldoIdUrl, ldoId }}>
            {children}
        </LdoContext.Provider>
    );
}

export default LdoProvider;