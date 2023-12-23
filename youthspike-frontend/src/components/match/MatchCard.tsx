import { IPlayer, ITeam } from '@/types';
import { IMatch } from '@/types/match';
import Link from 'next/link';
import React, { useState } from 'react';

interface ITeamCaptain extends ITeam {
    captain: IPlayer;
}

interface IMatchCaptain extends IMatch {
    teamA: ITeamCaptain;
    teamB: ITeamCaptain;
}

interface MatchCardProps {
    match: IMatchCaptain;
}

function MatchCard({ match }: MatchCardProps) {

    return (
        <li className='w-full bg-gray-700 py-2 flex justify-between items-center' style={{ minHeight: '6rem' }}>
            <Link href={`/matches/${match._id}`} className="w-full flex justify-between items-center" >
                <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
                    <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full ml-2" />
                    <div className="match-name flex flex-col w-full">
                        <h3>{match?.teamA?.name}</h3>
                        <p>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p>
                    </div>
                </div>
                <div className="w-2/10 text-center"><p className='w-10 h-10 rounded-full bg-yellow-500 text-gray-100 flex items-center justify-center'>VS</p></div>
                <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
                    <div className="match-name flex flex-col w-full">
                        <h3>{match?.teamB?.name}</h3>
                        <p>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p>
                    </div>
                    <img src="/free-logo.svg" alt="" className="w-10 h-10 border-4 border-yellow-500 rounded-full mr-2" />
                </div>
            </Link>
        </li>
    )
}

export default MatchCard;