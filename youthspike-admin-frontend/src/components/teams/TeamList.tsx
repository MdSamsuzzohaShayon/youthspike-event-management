import React from 'react';
import TeamCard from './TeamCard';
import { IEvent, ITeam } from '@/types';

interface TeamListProps {
    eventId: string;
    teamList: ITeam[];
    eventList?: IEvent[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function TeamList({ teamList, eventId, eventList, setIsLoading }: TeamListProps) {
    return (
        <div className="team-list flex flex-col justify-between items-center gap-3">
            {teamList.map((team) => <TeamCard key={team._id} team={team} eventId={eventId} eventList={eventList ? eventList : []} setIsLoading={setIsLoading} />)}
        </div>
    )
}

export default TeamList;