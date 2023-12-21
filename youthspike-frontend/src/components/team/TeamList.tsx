import { IPlayer, ITeam } from '@/types'
import React from 'react'
import TeamCard from './TeamCard'

interface IteamCaptain extends ITeam {
    captain: IPlayer;
}

function TeamList({teamList}: {teamList?: IteamCaptain[]}) {
  return (
    <div className='teamList w-full'>
        {teamList && teamList.length > 0 && teamList.map((team, i)=> (<TeamCard team={team} key={i} />))}
    </div>
  )
}

export default TeamList