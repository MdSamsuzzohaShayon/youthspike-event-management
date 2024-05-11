import { useMutation } from '@apollo/client';
import React, { useState, useEffect, useRef } from 'react';
import Message from '../elements/Message';
import { IError, IOption, IPlayer, ITeam, ITeamAdd } from '@/types';
import { ADD_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import TextInput from '../elements/forms/TextInput';
import SelectInput from '../elements/forms/SelectInput';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FileInput from '../elements/forms/FileInput';
import addOrUpdateTeam from '@/utils/requestHandlers/addOrUpdateTeam';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';

interface IPrevTeam extends ITeamAdd {
    _id: string;
}

interface ITeamAddProps {
    eventId: string;
    availablePlayers: IPlayer[];
    setAvailablePlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
    handleClose: (e: React.SyntheticEvent) => void;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    teamAddCB?: (teamData: ITeam) => void;
    currDivision?: string;
    update?: boolean;
    prevTeam?: IPrevTeam;
    refetchFunc?: () => Promise<void>;
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

function TeamAdd({ eventId, handleClose, setIsLoading, availablePlayers, setAvailablePlayers, setActErr, update, prevTeam, currDivision, teamAddCB, refetchFunc }: ITeamAddProps) {

    const router = useRouter();
    const [teamState, setTeamState] = useState<ITeamAdd>(prevTeam ? prevTeam : initialTeamState);
    const [updateTeamState, setUpdateTeamState] = useState<Partial<ITeamAdd>>({});
    const [playerIdList, setPlayerIdList] = useState<string[]>([]);

    const uploadedLogo = useRef<File | null>(null);

    // GraphQL
    const [addTeam, { data, loading, error }] = useMutation(ADD_A_TEAM);
    const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation(UPDATE_TEAM);




    // Handle events
    const handleTeamAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const success = await addOrUpdateTeam({
            eventId, teamState, setActErr, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState,
            playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, currDivision, teamAddCB
        });

        if(success){
            if (refetchFunc) await refetchFunc();
            const formEl = e.target as HTMLFormElement;
            formEl.reset();
            handleClose(e);
            router.push(`/${eventId}/teams`);
        }
    }

    const handleSaveAndCreate = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateTeam({
            eventId, teamState, setActErr, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState,
            playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, currDivision, teamAddCB
        });
        if (refetchFunc) await refetchFunc();
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

    const handleCheckboxChange = (playerId: string, isChecked: boolean) => {
        if (isChecked) {
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

    // Renders
    const toBeCaptains = () => {
        const playersWithEmail = availablePlayers.filter((ap) => playerIdList.includes(ap._id) && ap.email && ap.email.trim() !== '');
        const options = makeOptionList(playersWithEmail);
        return <SelectInput name='captain' vertical lw='w-full' rw='w-full' optionList={options && options.length > 0 ? options : []} handleSelect={handleInputChange} />
    }

    return (
        <form onSubmit={handleTeamAdd} className='flex flex-col gap-2'>
            <div className='input-group w-full flex flex-col'>
                {error && <Message error={error} />}
            </div>

            <TextInput name='name' required={!update} vertical defaultValue={teamState.name} handleInputChange={handleInputChange} />
            <FileInput defaultValue={teamState.logo} handleFileChange={handleFileChange} name='logo' extraCls='md:w-5/12 mt-4' />

            {!update && (<div className="player-input mb-4">
                <PlayerSelectInput availablePlayers={availablePlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name='player-select' />
            </div>)}
            {playerIdList.length > 0 && !update && toBeCaptains()}

            <div className="input-group w-full mb-4">
                <button className='btn-primary mr-2' type='submit'>{update ? "Update" : "Save"}</button>
                {!update && <button className='btn-primary' type='button' onClick={handleSaveAndCreate}>Save & Create Another</button>}
            </div>
        </form>
    )
}

export default TeamAdd;