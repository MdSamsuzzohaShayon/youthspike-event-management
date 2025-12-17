'use client';

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import NetList from '@/components/net/NetList';
import { GET_A_ROUND } from '@/graphql/round';
import { useError } from '@/lib/ErrorProvider';
import { IError, IRoundExpRel, IRoundRelatives, IRoundResponse } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client/react';
import React, { useEffect, useState } from 'react';

interface IRoundSingleProps {
  params: {
    eventId: string;
    roundId: string;
  };
}

function RoundSingle({ params }: IRoundSingleProps) {
  const { setActErr } = useError();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchRound, { data, loading, error }] = useLazyQuery<{ getRound: IRoundResponse }>(GET_A_ROUND);

  useEffect(() => {
    if (params.roundId) {
      if (isValidObjectId(params.roundId)) {
        fetchRound({ variables: { roundId: params.roundId } });
      } else {
        setActErr({ success: false, message: 'Can not fetch data due to invalid round ObjectId!' });
      }
    }
  }, [params.roundId]);

  if (loading || isLoading) return <Loader />;

  const currRound: IRoundExpRel | null = data?.getRound?.data || null;
  const allNets = data?.getRound?.data?.nets || [];

  if (error) {
    console.error(error);
  }
  useEffect(() => {
    setActErr({ message: error?.name, code: 400, success: false });
  }, [error]);

  return (
    <div className="RoundSingle container px-2 mx-auto min-h-screen">
      <h1>Round {currRound?.num}</h1>
      <h3>Nets</h3>
      <NetList netList={allNets} eventId={params.eventId} />
    </div>
  );
}

export default RoundSingle;
