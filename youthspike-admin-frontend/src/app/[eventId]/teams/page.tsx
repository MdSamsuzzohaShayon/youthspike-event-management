'use client'

import TeamMain from '@/components/teams/TeamMain';


interface ITeamsOfEventPage {
    params: {
        eventId: string
    }
}

function TeamsPage({params}: ITeamsOfEventPage) {
  return (
    <div className='container mx-auto px-2'>
        <TeamMain eventId={params.eventId} />
    </div>
  )
}

export default TeamsPage;