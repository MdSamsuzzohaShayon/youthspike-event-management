import cld from '@/config/cloudinary.config';
import { IMatchExpRel, IMatchRelatives, IPlayer, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useState } from 'react';
import TextImg from '../elements/TextImg';

interface ITeamCaptain extends ITeam {
    captain: IPlayer;
}

interface IMatchCaptain extends IMatchExpRel {
    teamA: ITeamCaptain;
    teamB: ITeamCaptain;
}

interface MatchCardProps {
    match: IMatchCaptain;
}

function MatchCard({ match }: MatchCardProps) {

    return (
        <div className='w-full bg-gray-700 py-2' style={{ minHeight: '6rem' }}>
            <Link href={`/matches/${match._id}`} className="w-full flex flex-col justify-center items-center" >
                <div className="content w-full px-2 text-center border-b border-gray-900">
                    {/* <h3>ID: {match._id}</h3> */}
                    <p>Location: {match.location}</p>
                    <p>Divisons: {match.division}</p>
                </div>
                <div className="w-full match-teams text-center  flex justify-between items-center">

                    <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
                        {match.teamA?.logo ? <AdvancedImage cldImg={cld.image(match.teamA.logo)} className='w-10' /> : <TextImg className='w-10 h-10' fullText={match.teamA.name} />}
                        <div className="match-name flex flex-col w-full">
                            <h3 className='capitalize'>{match?.teamA?.name}</h3>
                            <p className='capitalize'>Captain: {match?.teamA?.captain?.firstName + ' ' + match?.teamA?.captain?.lastName}</p>
                        </div>
                    </div>
                    <div className="w-2/10 text-center"><p className='w-10 h-10 rounded-full bg-yellow-400 text-gray-100 flex items-center justify-center'>VS</p></div>
                    <div className="img-wrapper h-full w-5/10 flex justify-between items-center gap-1">
                        <div className="match-name flex flex-col w-full">
                            <h3 className='capitalize'>{match?.teamB?.name}</h3>
                            <p className='capitalize'>Captain: {match?.teamB?.captain?.firstName + ' ' + match?.teamB?.captain?.lastName}</p>
                        </div>
                        {match.teamB?.logo ? <AdvancedImage cldImg={cld.image(match.teamB.logo)} className='w-10' /> : <TextImg className='w-10 h-10' fullText={match.teamB.name} />}
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default MatchCard;