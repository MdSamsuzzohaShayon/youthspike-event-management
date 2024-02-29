import { RefetchQueriesFunction, useMutation } from '@apollo/client';
import React, { useState, useEffect, useRef } from 'react';
import Loader from '../elements/Loader';
import Message from '../elements/Message';
import { IError, IOption, IPlayer, ITeam, ITeamAdd } from '@/types';
import { ADD_A_TEAM, ADD_TEAM_RAW, UPDATE_TEAM, UPDATE_TEAM_RAW } from '@/graphql/teams';
import TextInput from '../elements/forms/TextInput';
import SelectInput from '../elements/forms/SelectInput';
import Link from 'next/link';
import { divisionsToOptionList } from '@/utils/helper';
import { redirect, useRouter } from 'next/navigation';
import FileInput from '../elements/forms/FileInput';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import addOrUpdateTeam from '@/utils/requestHandlers/addOrUpdateTeam';
import { getDivisionFromStore, setDivisionToStore } from '@/utils/localStorage';

interface IPrevTeam extends ITeamAdd{
    _id: string;
}

interface ITeamAddProps {
    eventId: string;
    availablePlayers: IPlayer[];
    setAvailablePlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
    handleClose: (e: React.SyntheticEvent) => void;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    divisions: string;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    refetch: ()=> void;

    update?: boolean;
    prevTeam?: IPrevTeam;
}

const initialTeamState = {
    active: true,
    name: '',
    logo: null,
    event: '',
    division: '',
    players: [],
    captain: ''
};

function TeamAdd({ eventId, handleClose, setIsLoading, availablePlayers, divisions, setAvailablePlayers, setActErr, update, prevTeam, refetch }: ITeamAddProps) {

    const router = useRouter();
    const [teamState, setTeamState] = useState<ITeamAdd>(prevTeam ? prevTeam : initialTeamState);
    const [updateTeamState, setUpdateTeamState] = useState<Partial<ITeamAdd>>({});
    const [playerIdList, setPlayerIdList] = useState<string[]>([]);
    const [divisionList, setDivisionList] = useState<IOption[]>([]);

    const uploadedLogo = useRef<File | null>(null);

    // GraphQL
    const [addTeam, { data, loading, error }] = useMutation(ADD_A_TEAM);
    const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation(UPDATE_TEAM);



    
    // Handle events
    const handleTeamAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateTeam({eventId, teamState, setActErr, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState, 
            playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, refetch});

        // console.log({ resultData });
        const formEl = e.target as HTMLFormElement;
        formEl.reset();
        handleClose(e);
        router.push(`/${eventId}/teams`);
    }

    const handleSaveAndCreate = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateTeam({eventId, teamState, setActErr, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState, 
            playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, refetch});
    }


    const handleInputChange = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLInputElement | HTMLSelectElement;
        setTeamState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        if (update) {
            setUpdateTeamState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
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

    const handleFileChange = (e: React.SyntheticEvent) => {
        const fileInputEl = e.target as HTMLInputElement;
        if (fileInputEl && fileInputEl.files && fileInputEl.files.length > 0) {
            uploadedLogo.current = fileInputEl.files[0];
        }
    }

    const handleSelect = (e: React.SyntheticEvent) => {
        const selectInputEl = e.target as HTMLSelectElement;
        setTeamState((prevState) => ({ ...prevState, [selectInputEl.name]: selectInputEl.value.toLowerCase() }));
        setDivisionToStore(selectInputEl.value);
        if (update) {
            setUpdateTeamState((prevState) => ({ ...prevState, [selectInputEl.name]: selectInputEl.value }));
        }
    }

    useEffect(() => {
        const teamObj: Partial<ITeamAdd> = {};
        if (availablePlayers && availablePlayers.length > 0) {
            teamObj.captain = availablePlayers[0]._id 
        }

        const divs = divisionsToOptionList(divisions);
        setDivisionList(divs);

        // Set division from local Storage
        const selectedDivision = getDivisionFromStore();
        if(selectedDivision && !update){
            teamObj.division = selectedDivision;
        }

        if(Object.entries(teamObj).length > 0){
            setTeamState((prevState) => ({ ...prevState, ...teamObj }));
        }
    }, [divisions, availablePlayers]);
    


    // Renders
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

            <TextInput name='name' required={!update} vertical defaultValue={teamState.name} handleInputChange={handleInputChange} />
            <FileInput defaultValue={teamState.logo} handleFileChange={handleFileChange} name='logo' extraCls='md:w-5/12 mt-4' />

            <SelectInput key={crypto.randomUUID()} name='division' defaultValue={teamState.division} optionList={divisionList} handleSelect={handleSelect} lw='w-5/12' rw='w-5/12' />

            {!update && (
                <div className='input-group w-full flex flex-col'>
                    <label htmlFor="players">Select Players. <Link href={`/${eventId}/players`} className='underline underline-offset-1' >Create New Player!</Link></label>
                    <ul className='flex flex-wrap items-center gap-2'>
                        {availablePlayers.map((ap) => (<li key={ap._id} className='flex gap-1 items-center'>
                            <input type="checkbox" onChange={(e) => handleCheckboxChange(e, ap._id)} />
                            <span className='capitalize'>{`${ap.firstName} ${ap.lastName}`}</span>
                        </li>))}
                    </ul>
                </div>
            )}
            {playerIdList.length > 0 && !update && (
                <SelectInput key={crypto.randomUUID()} name='captain' vertical lw='w-full' rw='w-full' optionList={availablePlayers && availablePlayers.length > 0 ? selectedPlayers(availablePlayers, playerIdList) : []} handleSelect={handleInputChange} />
            )}

            <div className="input-group w-full">
                <button className='btn-primary mr-2' type='submit'>{update ? "Update" : "Save"}</button>
                {!update && <button className='btn-primary' type='button' onClick={handleSaveAndCreate}>Save & Create Another</button>}
            </div>
        </form>
    )
}

export default TeamAdd;