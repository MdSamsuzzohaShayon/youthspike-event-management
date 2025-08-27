import { CREATE_MULTIPLE_PLAYERS_RAW } from '@/graphql/players';
import { IOption } from '@/types';
import { BACKEND_URL } from '@/utils/keys';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { getDivisionFromStore } from '@/utils/localStorage';
import { useLdoId } from '@/lib/LdoProvider';
import { useError } from '@/lib/ErrorProvider';
import { handleError, handleResponse } from '@/utils/handleError';
import { getCookie } from '@/utils/clientCookie';
import FileInput from '../elements/forms/FileInput';

interface IMultiPlayerAddProps {
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  closeDialog: () => void;
  divisionList: IOption[];
}

// Define the type for the Apollo Client instance

function MultiPlayerAdd({ eventId, setIsLoading, closeDialog, divisionList }: IMultiPlayerAddProps) {
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  const uploadFileEl = useRef<File | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setSelectedDivision(inputEl.value);
  };

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    const selectedFile = inputEl.files?.[0];

    if (!selectedFile) return;

    
    const allowedFileTypes = ['csv', 'xlsx'];
    const fileName = selectedFile.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    // @ts-ignore
    if (!allowedFileTypes.includes(fileExtension)) {
      alert('Invalid file type. Please select a CSV or XLSX file.');
      inputEl.value = ''; // Clear the input
      return;
    }

    uploadFileEl.current = selectedFile;
  };

  const handleUploadMultiPlayers = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (selectedDivision === '') return;
      // Add logic for handling the upload
      if (!uploadFileEl.current || !uploadFileEl.current) {
        console.error("No file has been selected");
        return;
      };
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: CREATE_MULTIPLE_PLAYERS_RAW,
          variables: { eventId: eventId, uploadedFile: null, division: selectedDivision },
        }),
      );

      formData.set('map', JSON.stringify({ '0': ['variables.uploadedFile'] }));
      formData.set('0', uploadFileEl.current);
      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
      console.log({ response });

      const jsonRes = await response.json();
      const success = await handleResponse({ response: jsonRes?.data?.createMultiPlayers, setActErr });
      if (success) {
        await router.push(`/${eventId}/teams/${ldoIdUrl}`);
        if (jsonRes?.data?.createMultiPlayers?.code !== 201) {
          setActErr({ code: jsonRes.data.createMultiPlayers.code, message: 'Some email already registered with players!' });
        }
        window.location.reload();
        closeDialog();
      }
    } catch (error: any) {
      closeDialog();
      console.log(error);
      handleError({ error, setActErr });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const prevDivision = getDivisionFromStore();
    if (prevDivision) {
      setSelectedDivision(prevDivision);
    }
  }, []);

  return (
    <form onSubmit={handleUploadMultiPlayers}>
      {/* <div className="input-group w-full">
                <label htmlFor="multiplayers">Players file (CSV or XLSX)</label>
                <input type="file" ref={uploadFileEl} className='form-control w-full' onChange={handleInputChange} />
            </div> */}
      <FileInput handleFileChange={handleFileChange} name="player" label="Players file (CSV or XLSX)" />
      <SelectInput key="multi-player-add-select" handleSelect={handleDivisionChange} name="division" optionList={divisionList} defaultValue={selectedDivision} />
      <div className="input-group mt-4">
        <button type="submit" className="btn-info">
          Upload
        </button>
      </div>
    </form>
  );
}

export default MultiPlayerAdd;
