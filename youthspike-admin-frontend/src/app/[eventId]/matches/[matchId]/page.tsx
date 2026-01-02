import React from 'react';
import { IGetMatchResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { GET_A_MATCH_LIGHT } from '@/graphql/matches';
import { QueryRef } from '@apollo/client/react';
import MatchUpdateContainer from '@/components/match/MatchUpdateContainer';

interface IProps {
  params: TParams;
}

async function UpdateMatchPage({ params }: IProps) {
  const pathParams = await params;
  const { eventId, matchId } = pathParams;
  return (
    <PreloadQuery query={GET_A_MATCH_LIGHT} variables={{ matchId }}>
      {(queryRef) => <MatchUpdateContainer queryRef={queryRef as QueryRef<{ getMatch: IGetMatchResponse }>} eventId={eventId} />}
    </PreloadQuery>
  );
}

export default UpdateMatchPage;
