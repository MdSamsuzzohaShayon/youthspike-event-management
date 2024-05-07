import { useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { GET_LDOS } from '@/graphql/ldo';
import Loader from '../elements/Loader';
import Message from '../elements/Message';
import DirectorList from './DirectorList';

function LDOMainPage() {
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /**
   * Show list of directors
   */
  const { data, loading, error } = useQuery(GET_LDOS);

  if (loading || isLoading) return <Loader />;
  if (error) return <Message error={error} />;

  const ldos = data?.getEventDirectors?.data ? data.getEventDirectors.data : [];
  return (
    <div style={{ minHeight: '80vh' }}>
      <h1 className="mb-4 capitalize">League Director Organizations</h1>
      <DirectorList ldoList={ldos} />
    </div>
  );
}

export default LDOMainPage;
