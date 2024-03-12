import React, { useEffect, useState } from 'react'
import PlayerAdd from '../player/PlayerAdd'
import PlayerList from '../player/PlayerList'
import { IError, IEvent, IOption, ITeam } from '@/types'
import TextImg from '../elements/TextImg';
import { setDivisionToStore, setTeamToStore } from '@/utils/localStorage';

interface ITeamDetailProps {
    event: IEvent;
    team: ITeam;
    eventId: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    divisionList: IOption[];
    teamList: ITeam[];
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    refetchFunc?: () => Promise<void>;
}

function TeamDetail({ event, team, eventId, setIsLoading, divisionList, teamList, setActErr, refetchFunc }: ITeamDetailProps) {
    const [addPlayer, setAddPlayer] = useState<boolean>(false);

    useEffect(() => {
        // Set division
        setDivisionToStore(team.division);
        setTeamToStore(team._id);
    }, []);
    return (
        <React.Fragment>
            <h1 className='uppercase text-center'>Teams/roster</h1>
            <h1 className='uppercase text-center'>{event?.name}</h1>

            {/* Team detail  */}
            <div className="team-detail mt-8 w-full flex justify-center flex-col items-center">
                <TextImg className='w-20 h-20' fullText={team.name} txtCls='text-2xl' />
                <h3 className="capitalize">{team && team.name}</h3>
            </div>

            {addPlayer ? (<>
                <div className="flex w-full justify-between items-center mb-4">
                    <h3 >Player Add</h3>
                    <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
                </div>
                <PlayerAdd setIsLoading={setIsLoading} eventId={eventId} update={false} setAddPlayer={setAddPlayer} division={team.division} teamList={teamList} setActErr={setActErr} />
            </>) : (

                <div className="bulk-operations-players mt-8">
                    <div className="flex w-full justify-between items-center">
                        <h3 className='mt-4'>Player List</h3>
                        <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(true)} >Add Player</button>
                    </div>
                    <p>Make Inactive / Re-rank / A-Z</p>
                    <PlayerList eventId={eventId} playerList={team ? team.players : []} teamId={team._id} setIsLoading={setIsLoading} rankControls showRank 
                    divisionList={divisionList} teamList={teamList} refetchFunc={refetchFunc} />
                </div>
            )}

            {/* Show captain  */}
            {/* <CaptainCard team={team} /> */}
        </React.Fragment>
    )
}

export default TeamDetail