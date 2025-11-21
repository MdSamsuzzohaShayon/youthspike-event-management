'use client';

import React, { useState } from 'react';
import MatchAdd from './MatchAdd';
import RoundList from '../round/RoundList';
import Loader from '../elements/Loader';
import { IMatchExpRel, IRoundRelatives } from '@/types';

interface IMatchUpdateMainProps {
  match: IMatchExpRel;
  roundList: IRoundRelatives[];
  eventId: string;
  matchId: string;
}

function MatchUpdateMain({ match, roundList, eventId, matchId }: IMatchUpdateMainProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  

  if (isLoading) return <Loader />;
  return (
    <div>
      {match && <MatchAdd groupList={[]} prevMatch={match} eventId={eventId} setIsLoading={setIsLoading} update matchId={matchId} />}

      <h3>Rounds</h3>
      <RoundList roundList={roundList} eventId={eventId} />
    </div>
  );
}

export default MatchUpdateMain;
