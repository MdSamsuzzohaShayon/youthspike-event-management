'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Loader from '@/components/elements/Loader';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { useLazyQuery } from '@apollo/client';
import { GET_LDO } from '@/graphql/director';
import { handleResponse } from '@/utils/handleError';
import { useError } from '@/lib/ErrorProvider';
import { ILDO } from '@/types';

export default function AccountMain() {
  const { setActErr } = useError();
  const params       = useSearchParams();           // ✅ safe: inside Client Component
  const ldoIdParam   = params.get('ldoId');

  const [ldo, setLdo]       = useState<ILDO | null>(null);
  const [busy, setBusy]     = useState(false);
  const [getLdo, { loading, error }] = useLazyQuery(GET_LDO, { fetchPolicy: 'network-only' });

  const fetchLDO = async () => {
    const { data } = await getLdo({ variables: { dId: ldoIdParam } });
    if (await handleResponse({ response: data?.getEventDirector, setActErr })) {
      const d = data?.getEventDirector?.data;
      setLdo({
        name: d?.name,
        logo: d?.logo,
        phone: d?.phone,
        director: {
          email: d?.director?.email,
          firstName: d?.director?.firstName,
          lastName: d?.director?.lastName,
        },
      });
    }
  };

  useEffect(() => { fetchLDO(); }, []);

  if (loading || busy) return <Loader />;
  if (error)           return <p>{error.message}</p>;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 min-h-screen rounded-lg shadow-lg"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-6"
      >
        Account Setting (LDO)
      </motion.h1>

      <DirectorAdd
        setIsLoading={setBusy}
        update
        prevLdo={ldo}
        refetchFunc={fetchLDO}
      />
    </motion.div>
  );
}
