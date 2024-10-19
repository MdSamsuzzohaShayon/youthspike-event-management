'use client';

import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import { useUser } from './UserProvider';

// Create a context that holds both ldoIdUrl and ldoId
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

function LdoProvider({ children }: PropsWithChildren) {
  const user = useUser();
  const searchParams = useSearchParams();
  const [ldoIdUrl, setLdoIdUrl] = useState<string>('');
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

  // There can have some error due to this use memo hook
  const contextValue = useMemo(
    () => ({
      ldoIdUrl,
      ldoId,
    }),
    [ldoId, ldoIdUrl],
  );

  return <LdoContext.Provider value={contextValue}>{children}</LdoContext.Provider>;
}

export default LdoProvider;
