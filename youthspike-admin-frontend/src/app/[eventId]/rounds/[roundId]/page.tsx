'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import NetList from '@/components/net/NetList';
import { GET_A_ROUND } from '@/graphql/round';
import { IError, IRoundRelatives } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

interface IRoundSingleProps {
    params: {
        eventId: string;
        roundId: string;
    }
}

function RoundSingle({ params }: IRoundSingleProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [actErr, setActErr] = useState<IError | null>(null);
    const [fetchRound, { data, loading, error }] = useLazyQuery(GET_A_ROUND);


    useEffect(() => {
        if (params.roundId) {
            if (isValidObjectId(params.roundId)) {
                fetchRound({ variables: { roundId: params.roundId } });
            } else {
                setActErr({ success: false, message: "Can not fetch data due to invalid round ObjectId!" })
            }
        }

    }, [params.roundId]);

    if (loading || isLoading) return <Loader />;

    const currRound: IRoundRelatives = data?.getRound?.data;
    const allNets = data?.getRound?.data?.nets;

    return (
        <div className='RoundSingle container px-2 mx-auto min-h-screen'>
            <h1>Round {currRound?.num}</h1>
            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}
            <h3>Nets</h3>
            <NetList netList={allNets} eventId={params.eventId} />
        </div>
    )
}

export default RoundSingle