/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useRef, useState } from 'react';
import { GET_EVENTS } from '@/graphql/event';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { GET_LDO } from '@/graphql/director';
import { IDirector, IError, ILDO } from '@/types';

function AccountPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ldoState, setLdoState] = useState<ILDO | null>(null);
  const [actErr, setActErr] = useState<IError | null>(null);

  const [getLdo, { loading, error, data: ldoData }] = useLazyQuery(GET_LDO);
  // Query for director

  useEffect(() => {
    /**
     * Fetch director
     */
    (async () => {
      const { data } = await getLdo(); // Use dynamic id // use either ldoId or directorI      
      const ldoObj = data?.getEventDirector?.data;

      setLdoState({
        name: ldoObj?.name,
        logo: ldoObj?.logo,
        director: {
          email: ldoObj?.director?.login?.email,
          firstName: ldoObj?.director?.firstName,
          lastName: ldoObj?.director?.lastName,
          password: '',
          confirmPassword: '',
        }
      })
    })()
  }, []);

  if (loading || isLoading) return <Loader />;

  return (
    <div className="container px-2 mx-auto min-h-screen">
      <h1 className='my-4 text-center'>Account Setting (LDO)</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <DirectorAdd setIsLoading={setIsLoading} update prevLdo={ldoState} setActErr={setActErr} />
    </div>
  )
}

export default AccountPage;