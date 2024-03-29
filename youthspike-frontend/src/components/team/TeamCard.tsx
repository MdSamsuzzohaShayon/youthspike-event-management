import { IPlayer, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useState } from 'react';
import TextImg from '../elements/TextImg';
import cld from '@/config/cloudinary.config';

interface IteamCaptain extends ITeam {
    captain: IPlayer;
}

interface ITeamCardProps {
    team: IteamCaptain;
}

function TeamCard({ team }: ITeamCardProps) {

    return (
        <>
            <div className="team-card w-full p-2 bg-gray-700 rounded-lg flex items-start justify-between">
                <div className="w-6/12">
                    <Link href={`/teams/${team._id}`}>
                        <div className="brand flex gap-1 items-center">
                            {team.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className='w-12' /> : <TextImg className='w-12 h-12' fullText={team.name} />}
                            <h3 className='leading-none text-lg font-bold'>{team.name}</h3>
                        </div>
                        {/* <p>2-1 Record</p> */}
                    </Link>
                </div>
                <div className="w-6/12">
                    <Link href={`/teams/${team._id}`}>
                        <div className="brand flex gap-1">
                            {team.captain.profile ? <AdvancedImage cldImg={cld.image(team.captain.profile)} className='w-12' /> : <TextImg className='w-12 h-12' fText={team?.captain?.firstName} lText={team?.captain?.lastName} />}
                            <div className="caption flex flex-col">
                                <p className='uppercase text-xs'>Captain</p>
                                <h3 className='leading-none text-lg font-bold'>{team?.captain?.firstName + " " + team?.captain?.lastName}</h3>
                            </div>
                        </div>
                        {/* <p className='flex'><span><img src="/icons/telephone.svg" alt="telephone" className='w-6 svg-white' /></span>222-222-2222</p> */}
                        {team?.players && <p className='flex gap-1'>Active players <span className='flex items-center justify-center w-6 h-6 rounded-full bg-gray-900'>{team?.players?.length}</span></p>}
                    </Link>
                </div>
            </div>
        </>
    )
}

export default TeamCard;