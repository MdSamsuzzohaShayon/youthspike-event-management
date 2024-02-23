'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import MatchAdd from '@/components/match/MatchAdd';
import RoundList from '@/components/round/RoundList';
import { GET_A_MATCH } from '@/graphql/matches';
import { IError } from '@/types';
import { isValidObjectId, toMatchDefaultData } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';

/**
 * Test Match
 * 
 * Captain
 * ayyy.spence@gmail.com
 * braden.peterson8@gmail.com
 * 
 * Co-captains
 * bowenmaynard.24@shelleyschools.org
 * jarenhaggard2010@gmail.com
 */

interface MatchSingleProps {
    params: { eventId: string; matchId: string };
}

function MatchSingle({ params }: MatchSingleProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [actErr, setActErr] = useState<IError | null>(null);
    const [fetchMatch, { data, loading, error }] = useLazyQuery(GET_A_MATCH, { variables: { matchId: params.matchId } });
    

    useEffect(() => {
        if (params.matchId) {
            if (isValidObjectId(params.matchId)) {
                fetchMatch({ variables: { matchId: params.matchId } });
            } else {
                setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
            }
        }

    }, [params.matchId]);

    if (loading || isLoading) return <Loader />;

    const matchData = data?.getMatch?.data;
    const roundList = data?.getMatch?.data?.rounds;
    const defaultMatch = toMatchDefaultData({...matchData, teams: []});
    
    


    return (
        <div className='container mx-auto px-2 min-h-screen'>
            <h1 className='uppercase text-center'>Match</h1>

            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}

            <h1>Update Match</h1>
            <MatchAdd matchData={defaultMatch} eventId={params.eventId} setActErr={setActErr} setIsLoading={setIsLoading} update matchId={params.matchId} />

            <h3>Rounds</h3>
            <RoundList roundList={roundList} eventId={params.eventId} />
        </div>
    )
}

export default MatchSingle;