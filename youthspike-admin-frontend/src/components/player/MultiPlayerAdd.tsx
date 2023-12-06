import { CREATE_MULTIPLE_PLAYERS, CREATE_MULTIPLE_PLAYERS_RAW } from '@/graphql/players';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { useMutation } from '@apollo/client';
import React, { useRef } from 'react';

function MultiPlayerAdd({ eventId }: { eventId: string }) {
    const uploadFileEl = useRef<HTMLInputElement | null>(null);

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
        // Add logic for handling the upload
        console.log(uploadFileEl?.current);
        if (!uploadFileEl.current || !uploadFileEl.current.files) return;

        console.log(uploadFileEl.current.files[0]);
        const formData = new FormData();
        formData.set('operations', JSON.stringify({
            query: CREATE_MULTIPLE_PLAYERS_RAW,
            variables: { event: eventId, uploadedFile: null },
        }));

        formData.set('map', JSON.stringify({ '0': ['variables.uploadedFile'] }));
        formData.set('0', uploadFileEl.current.files[0]);
        const token = getCookie('token');
        const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });
        const jsonRes = await response.json();
        console.log(jsonRes);
        // Redirect to players page
        
    };

    return (
        <form onSubmit={handleUploadMultiPlayers}>
            <div className="input-group">
                <label htmlFor="multiplayers">Players file (CSV or XLSX)</label>
                <input type="file" ref={uploadFileEl} className='form-control' onChange={handleInputChange} />
            </div>
            <div className="input-group">
                <button type="submit" className="btn-secondary">Upload</button>
            </div>
        </form>
    );
}

export default MultiPlayerAdd;