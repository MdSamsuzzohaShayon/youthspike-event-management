import { useMutation } from '@apollo/client';
import React, { useState, useRef } from 'react';
import { IOption, IPlayer, ITeam, ITeamAdd, IGroup } from '@/types';
import { ADD_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import SelectInput from '../elements/forms/SelectInput';
import { useRouter } from 'next/navigation';
import FileInput from '../elements/forms/FileInput';
import addOrUpdateTeam from '@/utils/requestHandlers/addOrUpdateTeam';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import { useLdoId } from '@/lib/LdoProvider';
import Link from 'next/link';
import { useError } from '@/lib/ErrorContext';
import InputField from '../elements/forms/InputField';

interface IPrevTeam extends ITeamAdd {
    _id: string;
    group?: IGroup;
}

interface ITeamAddProps {
    eventId: string;
    players: IPlayer[];
    groupList: IGroup[];
    handleClose: (e: React.SyntheticEvent) => void;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
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

function TeamAdd({ eventId, groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, teamAddCB, refetchFunc }: ITeamAddProps) {

    const router = useRouter();
    const { ldoIdUrl } = useLdoId();
    const { setActErr } = useError();


    const [teamState, setTeamState] = useState<ITeamAdd>(prevTeam ? prevTeam : initialTeamState);
    const [updateTeamState, setUpdateTeamState] = useState<Partial<ITeamAdd>>({});
    const [playerIdList, setPlayerIdList] = useState<string[]>([]);
    const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>(players || []);

    const uploadedLogo = useRef<File | null>(null);

    // GraphQL
    const [addTeam, { data, loading, error }] = useMutation(ADD_A_TEAM);
    const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation(UPDATE_TEAM);


    console.log(prevTeam);




    // Handle events
    const handleTeamAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const success = await addOrUpdateTeam({
            setActErr,
            eventId, teamState, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState,
            playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, currDivision, teamAddCB
        });

        if (success) {
            if (refetchFunc) await refetchFunc();
            const formEl = e.target as HTMLFormElement;
            formEl.reset();
            handleClose(e);
            router.push(`/${eventId}/teams/${ldoIdUrl}`);
        }
    }

    const handleSaveAndCreate = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateTeam({
            setActErr,
            eventId, teamState, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState,
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
                id: i+1,
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
        return <SelectInput name='captain' optionList={options && options.length > 0 ? options : []} handleSelect={handleInputChange} />
    }

    return (
        <form onSubmit={handleTeamAdd} className='flex flex-col gap-2'>
            <InputField type="text" name='name' required={!update} defaultValue={teamState.name} className='mt-6' handleInputChange={handleInputChange} />
            <SelectInput key="g-t-d" handleSelect={handleInputChange} name='group' className='mt-6'
                {...(prevTeam?.group ? { defaultValue: prevTeam.group._id } : {})}
                optionList={teamState.division && teamState.division !== ''
                    ? groupList.filter((g) => g.division.trim().toUpperCase() === teamState.division.trim().toUpperCase()).map((g, gI) => ({ id: gI+1, text: g.name, value: g._id }))
                    : groupList.map((g, gI) => ({ id: gI+1,text: g.name, value: g._id }))} />
            <Link className='underline underline-offset-1' href={`/${eventId}/groups/new/${ldoIdUrl}`}>Create new group!</Link>

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