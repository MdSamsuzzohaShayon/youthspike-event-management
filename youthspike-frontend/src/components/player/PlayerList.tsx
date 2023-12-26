import { IPlayer } from '@/types'
import React from 'react'
import PlayerCard from './PlayerCard'

function PlayerList({playerList}: {playerList?: IPlayer[]}) {
  return (
    <div className='playerList w-full flex flex-col gap-1'>
        {playerList && playerList.length > 0 && playerList.map((p, i)=>(
            <PlayerCard player={p} key={p?._id} />
        ))}
    </div>
  )
}

export default PlayerList