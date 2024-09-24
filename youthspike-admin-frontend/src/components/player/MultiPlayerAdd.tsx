import { CREATE_MULTIPLE_PLAYERS, CREATE_MULTIPLE_PLAYERS_RAW } from '@/graphql/players';
import { IError, IOption } from '@/types';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { ApolloClient, ApolloClientOptions, RefetchQueriesFunction, useMutation } from '@apollo/client';
import { redirect, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { GET_EVENT_WITH_TEAMS } from '@/graphql/teams';
import { getDivisionFromStore } from '@/utils/localStorage';

type ApolloClientType = import('@apollo/client').ApolloClient<any>; // Replace 'any' with your specific schema types

interface IMultiPlayerAddProps {
    eventId: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    closeDialog: () => void;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    divisionList: IOption[];
}

// Define the type for the Apollo Client instance

function MultiPlayerAdd({ eventId, setIsLoading, closeDialog, setActErr, divisionList }: IMultiPlayerAddProps) {

    const uploadFileEl = useRef<HTMLInputElement | null>(null);
    const [selectedDivision, setSelectedDivision] = useState<string>('');
    const router = useRouter();

    const handleDivisionChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setSelectedDivision(inputEl.value);
    }

    const handleInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        const selectedFile = inputEl.files?.[0];

        if (!selectedFile) return;

        const allowedFileTypes = ['csv', 'xlsx'];
        const fileName = selectedFile.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        // @ts-ignore
        if (!allowedFileTypes.includes(fileExtension)) {
            alert('Invalid file type. Please select a CSV or XLSX file.')
            inputEl.value = ''; // Clear the input
            return;
        }
    };

    const handleUploadMultiPlayers = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (selectedDivision === '') return;
            // Add logic for handling the upload
            if (!uploadFileEl.current || !uploadFileEl.current.files) return;
            const formData = new FormData();
            formData.set('operations', JSON.stringify({
                query: CREATE_MULTIPLE_PLAYERS_RAW,
                variables: { eventId: eventId, uploadedFile: null, division: selectedDivision },
            }));

            formData.set('map', JSON.stringify({ '0': ['variables.uploadedFile'] }));
            formData.set('0', uploadFileEl.current.files[0]);
            const token = getCookie('token');
            const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });
            const jsonRes = await response.json();
            await router.push(`/${eventId}/teams`);
            if (jsonRes?.data?.createMultiPlayers?.code !== 201) {
                setActErr({ code: jsonRes.data.createMultiPlayers.code, message: "Some email already registered with players!" });
            }
            window.location.reload();
            closeDialog();
        } catch (error) {
            closeDialog();
            console.log(error);
            // @ts-ignore
            setActErr({name: error?.name, message: error?.message, main: error});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(()=>{
        const prevDivision = getDivisionFromStore();
        if(prevDivision){
            setSelectedDivision(prevDivision);
        }
    }, []);
    

    return (
        <form onSubmit={handleUploadMultiPlayers}>
            <div className="input-group w-full">
                <label htmlFor="multiplayers">Players file (CSV or XLSX)</label>
                <input type="file" ref={uploadFileEl} className='form-control w-full' onChange={handleInputChange} />
            </div>
            <SelectInput key="multi-player-add-select" vertical handleSelect={handleDivisionChange} name='division' optionList={divisionList} defaultValue={selectedDivision} />
            <div className="input-group mt-4">
                <button type="submit" className="btn-info">Upload</button>
            </div>
        </form>
    );
}

export default MultiPlayerAdd;