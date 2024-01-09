import { IAddMatch, IMatch } from '@/types'
import React from 'react'
import MatchCard from './MatchCard'

function MatchList({ matches, eventId }: { matches: IMatch[], eventId: string }) {
  return (
    <div>
      <h2 className='mb-4'>Match List</h2>
      <ul className='flex flex-wrap items-center'>
        {matches.length > 0 && matches.map((match: IMatch, i) => <MatchCard eventId={eventId} key={match._id} match={match} sl={i + 1} />)}
      </ul>
    </div>
  )
}

export default MatchList