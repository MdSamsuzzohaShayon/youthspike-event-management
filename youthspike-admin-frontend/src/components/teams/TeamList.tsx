import React from 'react';
import TeamCard from './TeamCard';
import { IEvent, ITeam } from '@/types';

interface TeamListProps {
    eventId: string;
    teamList: ITeam[];
    eventList?: IEvent[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    fefetchFunc?: () => Promise<void>;
}

function TeamList({ teamList, eventId, eventList, setIsLoading, fefetchFunc }: TeamListProps) {
    return (
        <div className="team-list flex flex-col justify-between items-center gap-3">
            {teamList.map((team) => <TeamCard key={team._id} team={team} eventId={eventId} eventList={eventList ? eventList : []} setIsLoading={setIsLoading} fefetchFunc={fefetchFunc} />)}
        </div>
    )
}

export default TeamList;