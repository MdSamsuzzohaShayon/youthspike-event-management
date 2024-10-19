'use client';

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import Login from '@/components/user/Login';
import { LOGIN_USER, LOGIN_USER_RAW } from '@/graphql/admin';
import { IError } from '@/types';
import { UserRole } from '@/types/user';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { setCookie, getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { useLdoId } from '@/lib/LdoProvider';

function LoginPage() {
  const router = useRouter();
  const {ldoIdUrl} = useLdoId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // To handle loading state
  const [actionsErrors, setActionsErrors] = useState<IError | null>(null);

  const handleLogin = async () => {
    try {
      if (email === '' || password === '') {
        return setActionsErrors({ success: false, message: 'Set correct email and password!' });
      }

      setLoading(true);  // Set loading to true before the request

      // Fetch the token for authentication
      const token = getCookie('token');

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : "",  // Add Authorization header
        },
        body: JSON.stringify({
          query: LOGIN_USER_RAW,  // Use your LOGIN_USER GraphQL query here
          variables: {
            email,
            password,
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors || data?.login?.code !== 202) {
        // If there are errors in the GraphQL response
        setActionsErrors({ success: false, message: errors ? errors[0]?.message : data?.login?.message });
        setCookie('token', '', -1); // Clear cookies on error
        setCookie('user', '', -1);
        setLoading(false);
        return;
      }

      // Successful login
      const resultData = data?.login;
      setCookie('token', resultData.data.token, 7);
      setCookie('user', JSON.stringify(resultData.data.user), 7);

      if (resultData.data.user.role === UserRole.admin) {
        router.push('/admin/directors');
      } else if ([UserRole.captain, UserRole.co_captain].includes(resultData.data.user.role)) {
        const eventIdOfPlayer = resultData.data.user.event;
        if (eventIdOfPlayer) {
          router.push(`/${eventIdOfPlayer}/matches`);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }

      setLoading(false);  // Stop loading after the request completes

    } catch (error) {
      setActionsErrors({ success: false, message: 'Login failed, please try again.' });
      console.log(error);
      
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen flex flex-col w-full justify-center items-center">
      {actionsErrors && <Message error={actionsErrors} />}
      <Login handleLogin={handleLogin} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
    </div>
  );
}

export default LoginPage;
