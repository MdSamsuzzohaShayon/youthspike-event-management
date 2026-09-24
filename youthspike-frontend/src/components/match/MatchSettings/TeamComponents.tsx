import TeamInMatch from '@/components/team/TeamInMatch'
import { useAppSelector } from '@/redux/hooks'
import React from 'react'

function TeamComponents() {
    const { myTeam, opTeam } = useAppSelector((state) => state.matches);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTeam && (
                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                    <TeamInMatch team={myTeam} home />
                </div>
            )}
            {opTeam && (
                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                    <TeamInMatch team={opTeam} home={false} />
                </div>
            )}
        </div>
    )
}

export default TeamComponents;