'use client'

import Loader from '@/components/elements/Loader';
import MatchAdd from '@/components/match/MatchAdd';
import RoundList from '@/components/round/RoundList';
import { GET_A_MATCH } from '@/graphql/matches';
import { useError } from '@/lib/ErrorContext';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';

/**
 * Test Match
 * 
 * PSG
 * Captain
 * gianluigi25
 * Co captain
 * marquinhos25
 * 
 * FC Barcelona
 * Captain
 * lionel23
 * Co captain
 * sergio23
 * 
 * Liverpool FC
 * Captain
 * virgil24
 * Co captain
 * alisson24
 */

interface MatchSingleProps {
    params: { eventId: string; matchId: string };
}

function MatchSingle({ params }: MatchSingleProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
      const {setActErr} = useError();
    
    const [fetchMatch, { data, loading, error, refetch }] = useLazyQuery(GET_A_MATCH, { variables: { matchId: params.matchId } });
    

    useEffect(() => {
        if (params.matchId) {
            if (isValidObjectId(params.matchId)) {
                fetchMatch({ variables: { matchId: params.matchId } });
            } else {
                setActErr({ success: false, message: "Can not fetch data due to invalid event ObjectId!" })
            }
        }

    }, [params.matchId]);

    if (loading || isLoading) return <Loader />;

    const matchData = data?.getMatch?.data;
    const roundList = data?.getMatch?.data?.rounds;
    

    if(error){
        console.log(error);
    }
    

    return (
        <div className='container mx-auto px-4 min-h-screen'>
            <h1 className='uppercase text-center'>Match</h1>

            {matchData && <MatchAdd groupList={[]} prevMatch={matchData} eventId={params.eventId} 
              setIsLoading={setIsLoading} update matchId={params.matchId} />}

            <h3>Rounds</h3>
            <RoundList roundList={roundList} eventId={params.eventId} />
        </div>
    )
}

export default MatchSingle;