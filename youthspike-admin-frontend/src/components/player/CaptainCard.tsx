import { IEvent, INetRelatives, IPlayer, ITeam } from '@/types';
import React, { useState } from 'react';

interface IExtedndedTeam {
    _id: string;
    active: boolean;
    name: string;
    logo?: string | null;
    division: string;
    event: IEvent;
    captain: IPlayer;
    players: IPlayer[];
    nets: INetRelatives[];
}

interface CaptainCardProps {
    teamData: IExtedndedTeam
}

function CaptainCard({ teamData }: CaptainCardProps) {
    const [actionOpen, setActionOpen] = useState<boolean>(false);

    const handleOpenAction = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setActionOpen(prevState => !prevState);
    }

    return (
        <div className="captain-card mt-8 w-full flex justify-between items-center relative">
            <div className="left-team w-6/12 flex justify-between items-center gap-1">
                <img src="/free-logo.svg" alt={teamData && teamData.name} className='w-20' />
                <div className="team-text">
                    <h4>{teamData.name}</h4>
                    <p className="text-yellow-logo text-black ">3-2</p>
                </div>
            </div>
            <div className="right-captain w-6/12 flex items-center justify-between gap-1">
                <img src="/free-logo.svg" className='w-20 h-20 border-4 border-yellow-logo text-black rounded-full' alt="captain" />
                <h3 className="capitalize">{teamData && teamData.captain.firstName} {teamData && teamData.captain.lastName}</h3>
                <img src="/icons/dots-vertical.svg" className='svg-white w-5 h-5 justify-end items-start' alt="menu" role="presentation" onClick={handleOpenAction} />
            </div>
            <ul className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-6 z-10 rounded-lg`}>
                <li>Remove</li>
                <li>Send Welcome Email</li>
            </ul>
        </div>
    )
}

export default CaptainCard;