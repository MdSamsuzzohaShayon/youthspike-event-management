import React from 'react'
import InfoCard from './InfoCard'
import DetailItem from './DetailItem'
import { IMatchSettingDetail } from '@/types'

function MatchConfiguration({matchDetails}: {matchDetails: IMatchSettingDetail}) {
  return (
    <InfoCard>
    <h4 className="text-yellow-400 font-bold text-lg mb-4 text-center">
      Match Configuration
    </h4>
    <div className="space-y-1">
      <DetailItem
        label="Net Variance"
        value={matchDetails.netVariance as number}
      />
      <DetailItem
        label="Number of Nets"
        value={matchDetails.numberOfNets as number}
      />
      <DetailItem
        label="Number of Rounds"
        value={matchDetails.numberOfRounds as number}
      />
      <DetailItem
        label="Tie Breaking"
        value={matchDetails.tieBreaking as string}
      />
    </div>
  </InfoCard>
  )
}

export default MatchConfiguration