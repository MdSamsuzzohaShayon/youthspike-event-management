'use client';

import React from 'react';
import InputField from '@/components/elements/InputField';
import { useMutation } from '@apollo/client/react';
import { ACCESS_CODE_VALIDATION } from '@/graphql/matches';
import { setAccessCode } from '@/utils/cookie';
import { EMessage, IAccessCode, IUser } from '@/types';
import { useAppDispatch } from '@/redux/hooks';
import { setMessage } from '@/redux/slices/elementSlice';

interface AccessCodeValidationResponse {
  accessCodeValidation: {
    data: {
      accessCode: string;
      match: string;
    };
    code: number;
  };
}

interface IAccessCodeFormProps {
  matchId: string;
  accessCodes: IAccessCode[];
}

function AccessCodeForm({ matchId, accessCodes }: IAccessCodeFormProps) {
  const dispatch = useAppDispatch();
  const [mutateAccessCode] = useMutation<AccessCodeValidationResponse>(ACCESS_CODE_VALIDATION);

  const handleInputChange = (E: React.SyntheticEvent) => {};

  const handleAccessCodeValidation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      const response = await mutateAccessCode({ variables: { input: data } });

      if(response?.data?.accessCodeValidation?.code === 404){
        console.error(response?.data?.accessCodeValidation);
        const error = new Error("Ask the director about access code for specific match, each match has different access code!");
        error.name = "Invalid access code!";
        throw error;
      }

      if (response?.data?.accessCodeValidation?.data) {

        const accessCode: IAccessCode = {
          match: matchId,
          code: response?.data?.accessCodeValidation?.data?.accessCode 
        }

        setAccessCode(accessCode);
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Mutation Error:', error);
      dispatch(setMessage({name: error?.name, message: error?.message || error?.name || error, type: EMessage.ERROR}));
    }
  };


  return (
    <form className="space-y-6" onSubmit={handleAccessCodeValidation}>
      <InputField name="accessCode" type="text" required label='Access Code' />

      <InputField name="matchId" type="text" defaultValue={matchId} required className="hidden" />

      <div className="text-center">
        <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200">
          Submit
        </button>
      </div>
    </form>
  );
}

export default AccessCodeForm;
