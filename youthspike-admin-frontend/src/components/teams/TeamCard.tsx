import { ITeam } from '@/types';
import Link from 'next/link';
import React, { useState } from 'react';

interface TeamCardProps {
    eventId: string;
    team: ITeam;
}

function TeamCard({ team, eventId }: TeamCardProps) {
    const [actionOpen, setActionOpen] = useState<boolean>(false);
    const [openMoveTeam, setOpenMoveTeam] = useState<boolean>(false);


    const handleOpenAction = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setActionOpen(prevState => !prevState);
    }

    const handleOpenMoveTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
        setOpenMoveTeam(prevState => !prevState);
    }

    const handleEditTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
    }

    const handleDeleteTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
    }

    const handleMakeInactive = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
        setOpenMoveTeam(prevState => !prevState);
    }
    



    return (
        <>
            <div className="team-card w-full p-2 bg-gray-700 rounded-lg flex items-start justify-between relative">
                <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
                    <li role="presentation" onClick={(e) => handleEditTeam(e, team._id)} >Edit</li>
                    <li role="presentation" onClick={(e) => handleOpenMoveTeam(e, team._id)}>Move Team</li>
                    <li role="presentation" onClick={(e) => handleDeleteTeam(e, team._id)}>Delete</li>
                    <li role="presentation" onClick={(e) => handleMakeInactive(e, team._id)} >Make Inactive</li>
                </ul>
                <div className="w-1/12">
                    <input type="checkbox" name="select-item" id="league-item" />
                </div>
                <div className="w-5/12">
                    <Link href={`/${eventId}/teams/${team._id}`}>
                        <div className="brand flex gap-1 items-center">
                            <img src="/free-logo.svg" alt="free-logo" className="w-12" />
                            <h3 className='leading-none text-lg font-bold'>{team.name}</h3>
                        </div>
                        <p>2-1 Record</p>
                    </Link>
                </div>
                <div className="w-5/12">
                    <Link href={`/${eventId}/teams/${team._id}`}>
                        <div className="brand flex gap-1">
                            <img src="/free-logo.svg" alt="free-logo" className="w-12 h-12 rounded-full border-2 border-yellow-500" />
                            <div className="caption flex flex-col">
                                <p className='uppercase text-xs'>Captain</p>
                                <h3 className='leading-none text-lg font-bold'>{team.captain?.firstName + " " + team.captain?.lastName}</h3>
                            </div>
                        </div>
                        <p className='flex'><span><img src="/icons/telephone.svg" alt="telephone" className='w-6 svg-white' /></span>222-222-2222</p>
                        <p className='flex gap-1'>Active players <span className='flex items-center justify-center w-6 h-6 rounded-full bg-gray-900'>{team?.players?.length}</span></p>
                    </Link>
                </div>
                <div className="w-1/12">
                    <img src="/icons/dots-vertical.svg" alt="dots-vertical" role="presentation" onClick={handleOpenAction} className="w-6 svg-white" />
                </div>
            </div>
            {openMoveTeam && (
                <div className="move-team w-full p-2 bg-gray-700 rounded-lg flex items-start justify-between relative">
                    Move Team
                </div>
            )}
        </>
    )
}

export default TeamCard;