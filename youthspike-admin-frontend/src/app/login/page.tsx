'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import Login from '@/components/user/Login'
import { LOGIN_USER } from '@/graphql/admin';
import { IError } from '@/types';
import { UserRole } from '@/types/user';
import { useMutation } from '@apollo/client';
import Head from 'next/head'
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginFunction, { data, error, loading }] = useMutation(LOGIN_USER);
  const [actionsErrors, setActionsErrors] = useState<IError>();

  const handleLogin = async (e: React.SyntheticEvent) => {
    const { data: resultData } = await loginFunction({
      variables: {
        email,
        password,
      },
    });
    if(email === '' || password === '') return setActionsErrors({name: "Invalid Credentials", message: "Set correct email and password!"})
    if (resultData?.login?.code === 200) {
      document.cookie = `token=${resultData.login.data.token};`;
      document.cookie = `user=${JSON.stringify(resultData.login.data.user)};`;
      console.log(resultData.login.data.user.role);
      if (resultData?.login?.data?.user?.role === UserRole.admin) {
        router.push('/admin/directors');
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
    <>
      <Head>
        <title>Login | Spikeball Game</title>
      </Head>

      <main className='flex flex-col w-full justify-center items-center' style={{ minHeight: '80vh' }} >
        {error && <Message error={error} />}
        <div className="container mx-auto px-2">
          {actionsErrors && <Message error={actionsErrors} />}
        </div>
        <Login handleLogin={handleLogin} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
      </main>
    </>
  )
}

export default LoginPage