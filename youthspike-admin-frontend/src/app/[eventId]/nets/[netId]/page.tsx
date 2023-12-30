'use client'

import Loader from '@/components/elements/Loader';
import NetTeamCard from '@/components/net/NetTeamCard';
import { GET_A_NET } from '@/graphql/net';
import { IError, INetRelatives } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

interface INetSingleProps {
    params: {
        eventId: string;
        netId: string;
    }
};

const TAPA = 1, TAPB = 2, TBPA = 3, TBPB = 4;

function SingleNet({ params }: INetSingleProps) {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [actErr, setActErr] = useState<IError | null>(null);
    const [fetchNet, { data, loading, error }] = useLazyQuery(GET_A_NET);

    // Get Team 1 players
    // Get Team 2 Players     

    useEffect(() => {
        if (params.netId) {
            if (isValidObjectId(params.netId)) {
                fetchNet({ variables: { netId: params.netId } });
            } else {
                setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid net ObjectId!" })
            }
        }

    }, [params.netId]);

    if (loading || isLoading) return <Loader />;

    const currNet = data?.getNet?.data;
    console.log(data);


    return (
        <div className='SingleNet container px-2 mx-auto'>
            <h1 className='text-center'>Net {currNet?.num}</h1>
            <div className="teams">
                {currNet.teamA ? <NetTeamCard team={currNet.teamA} teamScore={currNet.teamAScore} /> : <NetTeamCard />}
                <h2 className='text-center'>VS</h2>
                {currNet.teamB ? <NetTeamCard team={currNet.teamB} teamScore={currNet.teamBScore} /> : <NetTeamCard />}
            </div>
        </div>
    )
}

export default SingleNet;