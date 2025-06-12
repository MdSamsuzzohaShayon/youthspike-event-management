'use client';

import React from 'react';
import InputField from '@/components/elements/InputField';
import { useMutation } from '@apollo/client';
import { ACCESS_CODE_VALIDATION } from '@/graphql/matches';
import { getCookie, getUserFromCookie, setCookie } from '@/utils/cookie';
import { IUser } from '@/types';

interface IAccessCodeFormProps {
  matchId: string;
  userInfo: IUser | null;
}

function AccessCodeForm({ matchId, userInfo }: IAccessCodeFormProps) {
  const [mutateAccessCode] = useMutation(ACCESS_CODE_VALIDATION);

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
      // console.log('GraphQL Response:', response.data.accessCodeValidation.data);
      if (userInfo && response?.data?.accessCodeValidation?.data) {
        const newAccessCode = userInfo.accessCode
          ? [userInfo.accessCode, { matchId: matchId, code: response?.data?.accessCodeValidation?.data?.accessCode }]
          : [{ matchId: matchId, code: response?.data?.accessCodeValidation?.data?.accessCode }];
        const newInfo = { ...userInfo, accessCode: newAccessCode };
        setCookie('user', JSON.stringify(newInfo), 7);
        window.location.reload();
      }
    } catch (error) {
      console.error('Mutation Error:', error);
    }
  };

  // return (
  //   <form onSubmit={handleAccessCodeValidation}>
  //     <InputField name="accessCode" type="text" required />
  //     <InputField name="matchId" type="text" defaultValue={matchId} required className="hidden" />
  //     <button className="btn-info rounded-lg" type="submit">
  //       Submit
  //     </button>
  //   </form>
  // );

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
