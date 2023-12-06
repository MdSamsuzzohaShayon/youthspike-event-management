'use client'

import React from 'react';
import TeamMain from '@/components/teams/TeamMain';


interface ITeamsOfEventPage {
    params: {
        eventId: string
    }
}

function TeamsOfTheEventPage({params}: ITeamsOfEventPage) {
  return (
    <div className='container mx-auto px-2'>
        <TeamMain eventId={params.eventId} />
    </div>
  )
}

export default TeamsOfTheEventPage;