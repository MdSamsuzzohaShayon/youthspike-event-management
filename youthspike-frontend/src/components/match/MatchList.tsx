import { IMatchExpRel, IPlayer, ITeam } from '@/types';
import React from 'react';
import MatchCard from './MatchCard';

interface ITeamCaptain extends ITeam{
  captain: IPlayer;
}

interface IMatchCaptain extends IMatchExpRel{
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

function MatchList({ matchList }: { matchList?: IMatchCaptain[] }) {
  console.log(matchList);
  
  return (
    <div className='matchList flex flex-col gap-1'>
      {matchList && matchList.length > 0 && (matchList.map((match, i) => (<MatchCard match={match} key={i} />)))}
    </div>
  )
}

export default MatchList;