'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import Login from '@/components/user/Login'
import { LOGIN_USER } from '@/graphql/admin';
import { IError } from '@/types';
import { UserRole } from '@/types/user';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { setCookie } from '@/utils/cookie';

function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginFunction, { data, error, loading }] = useMutation(LOGIN_USER);
  const [actionsErrors, setActionsErrors] = useState<IError>();

  const handleLogin = async (e: React.SyntheticEvent) => {
    if (email === '' || password === '') return setActionsErrors({ success: false, message: "Set correct email and password!" });
    const { data: resultData } = await loginFunction({
      variables: {
        email,
        password,
      },
    });
    if (resultData?.login?.code === 202) {
      setCookie('token', resultData.login.data.token, 7);
      setCookie('user', JSON.stringify(resultData.login.data.user), 7);
      if (resultData?.login?.data?.user?.role === UserRole.admin) {
        router.push('/admin/directors');
      } else if (resultData?.login?.data?.user?.role === UserRole.captain || resultData?.login?.data?.user?.role === UserRole.co_captain) {
        const eventIdOfPlayer = resultData.login.data.user?.event;
        if (eventIdOfPlayer) {
          router.push(`/${eventIdOfPlayer}/matches`);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } else {
      // Create custom error
      const errObj = window.structuredClone(resultData);
      errObj.name = resultData?.login?.code;
      errObj.message = resultData?.login?.message;
      setActionsErrors(errObj)
      document.cookie = `token=;`;
      document.cookie = `user=;`;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen flex flex-col w-full justify-center items-center">
      {error && <Message error={error} />}
      {actionsErrors && <Message error={actionsErrors} />}
      <Login handleLogin={handleLogin} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
    </div>
  )
}

export default LoginPage