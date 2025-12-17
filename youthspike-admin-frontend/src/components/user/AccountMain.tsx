'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Loader from '@/components/elements/Loader';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { GET_LDO } from '@/graphql/director';
import { useError } from '@/lib/ErrorProvider';
import { IGetEventDirectorQuery, ILDO } from '@/types';
import { useLazyQuery } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';

export default function AccountMain() {
  const { setActErr } = useError();
  const params = useSearchParams(); // ✅ safe: inside Client Component
  const ldoIdParam = params.get('ldoId');

  const [ldo, setLdo] = useState<ILDO | null>(null);
  const [busy, setBusy] = useState(false);
  const [getLdo, { loading, error }] = useLazyQuery<{ getEventDirector: IGetEventDirectorQuery }>(GET_LDO, { fetchPolicy: 'network-only' });

  const fetchLDO = async () => {
    const { data } = await getLdo({ variables: { dId: ldoIdParam } });
    if (await handleResponseCheck(data?.getEventDirector, setActErr)) {
      if (data?.getEventDirector?.data) setLdo(data?.getEventDirector?.data);
    }
  };

  useEffect(() => {
    fetchLDO();
  }, []);

  if (loading || busy) return <Loader />;
  if (error) return <p>{error.message}</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container mx-auto px-4 py-8 min-h-screen rounded-lg shadow-lg">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-center mb-6">
        Account Setting (LDO)
      </motion.h1>

      <DirectorAdd setIsLoading={setBusy} update prevLdo={ldo} refetchFunc={fetchLDO} />
    </motion.div>
  );
}
