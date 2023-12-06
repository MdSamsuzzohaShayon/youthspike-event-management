import { useMutation } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import Loader from '../elements/Loader';
import Message from '../elements/Message';
import { IOption, IPlayer, ITeam, ITeamAdd } from '@/types';
import { ADD_A_TEAM } from '@/graphql/teams';
import TextInput from '../elements/forms/TextInput';
import SelectInput from '../elements/forms/SelectInput';

interface ITeamAddProps {
    eventId: string;
    availablePlayers: IPlayer[],
    handleClose: (e: React.SyntheticEvent) => void;
    setIsLoading: (state: boolean) => void;
}

const initialTeamState = {
    active: true,
    name: '',
    event: '',
    players: [],
    captain: ''
};

function TeamAdd({ eventId, handleClose, setIsLoading, availablePlayers }: ITeamAddProps) {
    const [teamState, setTeamState] = useState<ITeamAdd>(initialTeamState);
    const [playerIdList, setPlayerIdList] = useState<string[]>([]);

    // GraphQL
    // Get all coaches / players
    const [addTeam, { data, loading, error, reset }] = useMutation(ADD_A_TEAM); // Do caching


    const handleTeamAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const teamObj = { ...teamState, players: playerIdList, event: eventId };
            const teamRes = await addTeam({
                variables: { input: teamObj }
            });
            console.log(teamRes);

        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }

        // console.log({ resultData });
        const formEl = e.target as HTMLFormElement;
        formEl.reset();
        handleClose(e);
    }

    useEffect(() => {
        return () => {
            reset();
        }
    }, []);

    const handleInputChange = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLInputElement | HTMLSelectElement;
        setTeamState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }

    const makeOptionList = (ap: IPlayer[]): IOption[] => {
        const newPlayerList: IOption[] = [];
        for (let i = 0; i < ap.length; i += 1) {
            newPlayerList.push({
                text: ap[i].firstName + " " + ap[i].lastName,
                value: ap[i]._id
            });
        }
        return newPlayerList;
    }

    const handleCheckboxChange = (e: React.SyntheticEvent, playerId: string) => {
        const checkboxEl = e.target as HTMLInputElement;
        if (checkboxEl.checked) {
            // @ts-ignore
            setPlayerIdList((prevState) => ([...new Set([...prevState, playerId])]));
        } else {
            setPlayerIdList((prevState) => prevState.filter((p) => p !== playerId));
        }
    }

    useEffect(() => {
        if (availablePlayers && availablePlayers.length > 0) {
            setTeamState((prevState) => ({ ...prevState, captain: availablePlayers[0]._id }));
        }
    }, []);

    const selectedPlayers = (ap: IPlayer[], pil: string[]): IOption[] => {
        const newAp = ap.filter(p => pil.includes(p._id));
        const options = makeOptionList(newAp);
        return options;
    }

    return (
        <form onSubmit={handleTeamAdd} className='flex flex-col gap-2'>
            <div className='input-group w-full flex flex-col'>
                {error && <Message error={error} />}
            </div>

            <TextInput name='name' required vertical defaultValue={teamState.name} handleInputChange={handleInputChange} />
            <SelectInput name='captain' vertical lw='w-full' rw='w-full' optionList={availablePlayers && availablePlayers.length > 0 ? selectedPlayers(availablePlayers, playerIdList) : []} handleSelect={handleInputChange} />
            <div className='input-group w-full flex flex-col'>
                <label htmlFor="players">Select Players</label>
                <ul className='flex flex-wrap items-center gap-2'>
                    {availablePlayers.map((ap) => (<li key={ap._id} className='flex gap-1 items-center'>
                        <input type="checkbox" onChange={(e) => handleCheckboxChange(e, ap._id)} />
                        <span className='capitalize'>{`${ap.firstName} ${ap.lastName}`}</span>
                    </li>))}
                </ul>
            </div>

            <div className="input-group w-full">
                <button className='btn-primary' type='submit'>Create</button>
            </div>
        </form>
    )
}

export default TeamAdd;