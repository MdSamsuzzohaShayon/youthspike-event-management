'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';

import { CREATE_MULTIPLE_PLAYERS_RAW } from '@/graphql/players';
import { IOption } from '@/types';
import { BACKEND_URL } from '@/utils/keys';
import { getCookie } from '@/utils/clientCookie';
import { handleError } from '@/utils/handleError';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';

import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';

import FileInput from '../elements/forms/FileInput';
import SelectInput from '../elements/forms/SelectInput';

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

interface MultiPlayerAddProps {
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  closeDialog: () => void;
  divisionList: IOption[];
}

type AllowedFileExtension = 'csv' | 'xlsx';

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                               */
/* -------------------------------------------------------------------------- */

const isValidFileType = (file: File): boolean => {
  const allowedExtensions: AllowedFileExtension[] = ['csv', 'xlsx'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return !!extension && allowedExtensions.includes(extension as AllowedFileExtension);
};

/* -------------------------------------------------------------------------- */
/*                              Main Component                                 */
/* -------------------------------------------------------------------------- */

function MultiPlayerAdd({
  eventId,
  setIsLoading,
  closeDialog,
  divisionList,
}: MultiPlayerAddProps) {
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();

  const uploadedFileRef = useRef<File | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  /* --------------------------- Event Handlers ------------------------------ */

  const handleDivisionChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      setSelectedDivision(inputEl.value);
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      const file = inputEl.files?.[0];
      if (!file) return;

      if (!isValidFileType(file)) {
        alert('Invalid file type. Please select a CSV or XLSX file.');
        inputEl.value = '';
        return;
      }

      uploadedFileRef.current = file;
    },
    [],
  );

  const handleUploadMultiPlayers = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedDivision || !uploadedFileRef.current) {
      showMessage({ type: 'error', code: 400, message: 'Division and file are required.' });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      formData.set(
        'operations',
        JSON.stringify({
          query: CREATE_MULTIPLE_PLAYERS_RAW,
          variables: {
            eventId,
            uploadedFile: null,
            division: selectedDivision,
          },
        }),
      );

      formData.set('map', JSON.stringify({ '0': ['variables.uploadedFile'] }));
      formData.set('0', uploadedFileRef.current);

      const token = getCookie('token');

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'apollo-require-preflight': 'true',
        },
      });

      const responseJson = await response.json();

      const success = await handleResponseCheck(
        responseJson?.data?.createMultiPlayers,
        showMessage,
      );

      if (!success) return;

      await router.push(`/${eventId}/teams/${ldoIdUrl}`);

      if (responseJson?.data?.createMultiPlayers?.code !== 201) {
        showMessage({
          type: 'error',
          code: responseJson.data.createMultiPlayers.code,
          message: 'Some email already registered with players!',
        });
      }

      window.location.reload();
      closeDialog();
    } catch (error) {
      closeDialog();
      handleError({ error, showMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------ Effects ---------------------------------- */

  useEffect(() => {
    const storedDivision = SessionStorageService.getItem(DIVISION);
    if (storedDivision) {
      setSelectedDivision(storedDivision as string);
    }
  }, []);

  /* ------------------------------ Render ----------------------------------- */

  return (
    <form onSubmit={handleUploadMultiPlayers}>
      <FileInput
        name="player"
        label="Players file (CSV or XLSX)"
        handleFileChange={handleFileChange}
      />

      <SelectInput
        name="division"
        optionList={divisionList}
        handleSelect={handleDivisionChange}
        defaultValue={selectedDivision}
      />

      <div className="input-group mt-4">
        <button type="submit" className="btn-info">
          Upload
        </button>
      </div>
    </form>
  );
}

export default MultiPlayerAdd;
