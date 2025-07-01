'use client';

import React, { useEffect, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { GET_LDO } from '@/graphql/director';
import { IError, ILDO } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { motion } from 'motion/react';
import { useError } from '@/lib/ErrorContext';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6 } },
};

const AccountPage = () => {

  const { setActErr } = useError();

  const [isLoading, setIsLoading] = useState(false);
  const [ldoState, setLdoState] = useState<ILDO | null>(null);

  const [getLdo, { loading, error, refetch }] = useLazyQuery(GET_LDO, { fetchPolicy: 'network-only' });

  const fetchLDO = async () => {
    const searchParams = new URLSearchParams(location.search);
    const ldoIdParam = searchParams.get('ldoId');

    const { data } = await getLdo({ variables: { dId: ldoIdParam } });
    const ldoObj = data?.getEventDirector?.data;
    const success = await handleResponse({ response: data?.getEventDirector, setActErr });

    if (!success) return;

    setLdoState({
      name: ldoObj?.name,
      logo: ldoObj?.logo,
      phone: ldoObj?.phone,
      director: {
        email: ldoObj?.director?.email,
        firstName: ldoObj?.director?.firstName,
        lastName: ldoObj?.director?.lastName,
        // password: '',
        // confirmPassword: '',
      },
    });
  };

  const refetchFunc = async () => {
    await fetchLDO();
  };

  useEffect(() => {
    fetchLDO();
  }, []);

  if (loading || isLoading) return <Loader />;
  if (error) {
    console.log(error);

  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={pageVariants}
      className="container mx-auto px-4 py-8 min-h-screen rounded-lg shadow-lg"
    >
      {/* Title */}
      <motion.h1
        variants={titleVariants}
        className="text-3xl font-bold text-center mb-6"
      >
        Account Setting (LDO)
      </motion.h1>

      {/* Director Form */}
      <DirectorAdd
        setIsLoading={setIsLoading}
        update
        prevLdo={ldoState}
        refetchFunc={refetchFunc}
      />
    </motion.div>
  );
};

export default AccountPage;
