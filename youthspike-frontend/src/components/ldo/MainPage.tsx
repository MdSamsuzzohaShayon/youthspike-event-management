import { useQuery } from '@apollo/client';
import React, { useState } from 'react'
import Loader from '../elements/Loader';
import Message from '../elements/Message';
import { GET_LDOS } from '@/graphql/ldo';
import DirectorList from './DirectorList';

function LDOMainPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    /**
     * Show list of directors
     */
    const { data, loading, error } = useQuery(GET_LDOS);

    if (loading || isLoading) return <Loader />;
    if (error) return <Message error={error} />;

    const ldos = data?.getEventDirectors?.data ? data.getEventDirectors.data : [];
    return (
        <div>
            <h1>League Director Organizations</h1>
            <DirectorList ldoList={ldos} />
        </div>
    )
}

export default LDOMainPage