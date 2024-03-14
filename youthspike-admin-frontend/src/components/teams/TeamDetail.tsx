import React, { useEffect, useState } from 'react'
import PlayerAdd from '../player/PlayerAdd'
import PlayerList from '../player/PlayerList'
import { IError, IEvent, IOption, IPlayer, ITeam } from '@/types'
import TextImg from '../elements/TextImg';
import { setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import { useMutation } from '@apollo/client';
import { UPDATE_TEAM } from '@/graphql/teams';

interface ITeamDetailProps {
    event: IEvent;
    team: ITeam;
    eventId: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    divisionList: IOption[];
    teamList: ITeam[];
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    refetchFunc?: () => Promise<void>;
    playerList: IPlayer[];
}

function TeamDetail({ event, team, eventId, setIsLoading, divisionList, teamList, setActErr, refetchFunc, playerList }: ITeamDetailProps) {
    const [addPlayer, setAddPlayer] = useState<boolean>(false);
    const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
    const [playerIdsToAdd, setPlayerIdsToAdd] = useState<string[]>([]);

    const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation(UPDATE_TEAM);

    const handleCheckboxChange = (pId: string, isChecked: boolean) => {
        if (isChecked) {
            // @ts-ignore
            setPlayerIdsToAdd((prevState) => ([...new Set([...prevState, pId])]));
        } else {
            setPlayerIdsToAdd((prevState) => prevState.filter((p) => p !== pId));
        }
    }

    const handleAddPlayersToTeam = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            await mutateTeam({ variables: { input: { players: playerIdsToAdd }, teamId: team._id, eventId: event._id } });
            if (refetchFunc) refetchFunc();
            setAddPlayer(false);
        } catch (error) {
            console.log(error);
            // @ts-ignore
            setActErr({ name: error.name, message: error.message, main: error })
        }
    }

    useEffect(() => {
        // Set division
        setDivisionToStore(team.division);
        setTeamToStore(team._id);

    }, []);


    useEffect(() => {
        // Get available players from all player list
        const napList: IPlayer[] = playerList ? playerList.filter((p: IPlayer) => !p.teams || p.teams.length === 0) : []; // nap List = new available players List
        let nfpList = [...napList]; // fnp List = new filtered player List
        nfpList = napList.filter((p) => p.division && p.division.trim().toLowerCase() === team.division.trim().toLowerCase());
        setFilteredPlayers(nfpList);
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
                    <h3 >Player Add to Team</h3>
                    <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
                </div>
                <form onSubmit={handleAddPlayersToTeam} >
                    <PlayerSelectInput availablePlayers={filteredPlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name='add-player-to-team' />
                    <button type="submit" className='btn-primary mt-4' >Add</button>
                </form>
            </>) : (

                <div className="bulk-operations-players mt-8">
                    <div className="flex w-full justify-between items-center">
                        <h3 className='mt-4'>Player List</h3>
                        <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(true)} >Player Add to Team</button>
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