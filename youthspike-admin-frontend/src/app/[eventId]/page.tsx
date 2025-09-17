import React from 'react';
import Teams from '@/components/teams/Teams';
import { TParams } from '@/types';


interface ITeamsOfEventPage {
    params: TParams
}

async function TeamsOfTheEventPage({params}: ITeamsOfEventPage) {
  return (
    <div className='team-main container mx-auto px-4 py-6 min-h-screen'>
        <Teams params={params} />
    </div>
  )
}

export default TeamsOfTheEventPage;