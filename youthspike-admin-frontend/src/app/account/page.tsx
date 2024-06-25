/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { GET_LDO } from '@/graphql/director';
import { IError, ILDO } from '@/types';
import { handleResponse } from '@/utils/handleError';

function AccountPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ldoState, setLdoState] = useState<ILDO | null>(null);
  const [actErr, setActErr] = useState<IError | null>(null);

  const [getLdo, { loading, error, data: ldoData, refetch }] = useLazyQuery(GET_LDO, {fetchPolicy: 'network-only'});
  // Query for director



  const fetchLDO= async () => {
    const searchParams = new URLSearchParams(location.search);
    const ldoIdParam = searchParams.get('ldoId');

    const { data } = await getLdo({ variables: {dId: ldoIdParam} }); // Use dynamic id // use either ldoId or directorI      
    const ldoObj = data?.getEventDirector?.data;
    const success = handleResponse({ response: data?.getEventDirector, setActErr });
    if (!success) return;


    setLdoState({
      name: ldoObj?.name,
      logo: ldoObj?.logo,
      director: {
        email: ldoObj?.director?.email,
        firstName: ldoObj?.director?.firstName,
        lastName: ldoObj?.director?.lastName,
        password: '',
        confirmPassword: '',
      }
    })
  }

  const refetchFunc= async ()=>{
    await fetchLDO();
  }

  useEffect(() => {
    /**
     * Fetch director
     */
    (async ()=>{
      await fetchLDO();
    })()
  }, []);

  if (loading || isLoading) return <Loader />;

  return (
    <div className="container px-2 mx-auto min-h-screen">
      <h1 className='my-4 text-center'>Account Setting (LDO)</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <DirectorAdd setIsLoading={setIsLoading} update prevLdo={ldoState} setActErr={setActErr} refetchFunc={refetchFunc} />
    </div>
  )
}

export default AccountPage;