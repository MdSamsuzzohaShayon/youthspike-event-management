import { IAddMatch, IMatch } from '@/types'
import React from 'react'
import MatchCard from './MatchCard'

function MatchList({ matches }: { matches: IMatch[] }) {
  return (
    <div>
      <h1>Match List</h1>
      <ul className='flex flex-wrap items-center'>
        {matches.length > 0 && matches.map((match: IMatch, i) => <MatchCard key={match._id} match={match} sl={i + 1} />)}
      </ul>
    </div>
  )
}

export default MatchList