import { CREATE_MULTIPLE_PLAYERS, CREATE_MULTIPLE_PLAYERS_RAW } from '@/graphql/players';
import { IError, IOption } from '@/types';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { useMutation } from '@apollo/client';
import { redirect } from 'next/navigation';
import React, { useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';

interface IMultiPlayerAddProps {
    eventId: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    closeDialog: () => void;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    divisionList: IOption[]
}

function MultiPlayerAdd({ eventId, setIsLoading, closeDialog, setActErr, divisionList}: IMultiPlayerAddProps) {
    const uploadFileEl = useRef<HTMLInputElement | null>(null);
    const [selectedDivision, setSelectedDivision] = useState<string>('');

    const handleDivisionInput=(e: React.SyntheticEvent)=>{
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
            // Display an error or perform any other actions for invalid file types
            alert('Invalid file type. Please select a CSV or XLSX file.')
            inputEl.value = ''; // Clear the input
            return;
        }
        // Continue processing the file
    };

    const handleUploadMultiPlayers = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if(selectedDivision === '') return;
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
            if(jsonRes?.data?.createMultiPlayers?.code !== 201){
                setActErr({name: jsonRes.data.createMultiPlayers.code, message: "Some email already registered with players!"});
            }
            // Redirect to players page
            closeDialog();
            // redirect(`/${eventId}/players`);
        } catch (error) {
            closeDialog();
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleUploadMultiPlayers}>
            <div className="input-group">
                <label htmlFor="multiplayers">Players file (CSV or XLSX)</label>
                <input type="file" ref={uploadFileEl} className='form-control' onChange={handleInputChange} />
            </div>
            <SelectInput vertical handleSelect={handleDivisionInput} name='division' optionList={divisionList} defaultValue="" />
            <div className="input-group">
                <button type="submit" className="btn-secondary">Upload</button>
            </div>
        </form>
    );
}

export default MultiPlayerAdd;