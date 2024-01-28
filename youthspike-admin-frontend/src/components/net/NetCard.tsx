import { INetRelatives } from '@/types'
import Link from 'next/link'
import React from 'react'

interface INetCardProps {
  eventId: string;
  net: INetRelatives;
}

function NetCard({ eventId, net }: INetCardProps) {
  return (
    <div className='w-full bg-gray-700 rounded-lg p-2'>
      <Link href={`/${eventId}/nets/${net._id}`} className='w-full flex justify-between item-center gap-1'>
        <div className="left w-3/6">
          <p>Net Number: {net.num}</p>
          <p>Points: {net.points}</p>
        </div>
        <div className="right w-3/6">
          <p>Team A Score: {net.teamAScore ? net.teamAScore : 0}</p>
          <p>Team B Score: {net.teamBScore ? net.teamBScore : 0}</p>
        </div>
      </Link>
    </div>
  )
}

export default NetCard