import { ITeam } from '@/types';
import React from 'react';
import NetPlayer from './NetPlayer';

interface INetTeamCardProps {
    team?: ITeam;
    teamScore?: number;
}

function NetTeamCard({ team, teamScore }: INetTeamCardProps) {
    return (
        <div className="team-a w-full bg-gray-800 p-2 rounded-lg">
            <h3>Team Name</h3>
            <p className="points">Points {teamScore ? teamScore : 'N/A'}</p>
            <div className="players">
                <NetPlayer />
                <NetPlayer />
            </div>
        </div>
    )
}

export default NetTeamCard;