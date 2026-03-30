'use client';

import Loader from '@/components/elements/Loader';
import NetTeamCard from '@/components/net/NetTeamCard';
import { GET_A_NET } from '@/graphql/net';
import { useMessage } from '@/lib/MessageProvider';
import { INetRes } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client/react';
import React, { useEffect, useState } from 'react';

interface INetSingleProps {
  params: {
    eventId: string;
    netId: string;
  };
}

function SingleNet({ params }: INetSingleProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showMessage } = useMessage();

  const [fetchNet, { data, loading, error }] = useLazyQuery<{ getNet: INetRes }>(GET_A_NET);

  // Get Team 1 players
  // Get Team 2 Players

  useEffect(() => {
    if (params.netId) {
      if (isValidObjectId(params.netId)) {
        fetchNet({ variables: { netId: params.netId } });
      } else {
        showMessage({ message: 'Can not fetch data due to invalid net ObjectId!', type: "error" });
      }
    }
  }, [params.netId]);

  if (loading || isLoading) return <Loader />;

  const currNet = data?.getNet?.data;

  if (error) {
    console.log(error);
  }

  return (
    <div className="SingleNet container px-2 mx-auto min-h-screen">
      <h1 className="text-center">Net {currNet?.num}</h1>
      <div className="teams">
        {currNet && (currNet.teamA ? <NetTeamCard team={currNet.teamA} teamScore={currNet.teamAScore} /> : <NetTeamCard />)}
        <h2 className="text-center">VS</h2>
        {currNet && (currNet.teamB ? <NetTeamCard team={currNet.teamB} teamScore={currNet.teamBScore} /> : <NetTeamCard />)}
      </div>
    </div>
  );
}

export default SingleNet;
