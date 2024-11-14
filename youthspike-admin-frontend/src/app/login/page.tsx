'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import Login from '@/components/user/Login';
import { LOGIN_USER } from '@/graphql/admin';
import { IError } from '@/types';
import { UserRole } from '@/types/user';
import { setCookie } from '@/utils/cookie';

function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [actErr, setActErr] = useState<IError | null>(null);

  // Apollo mutation hook
  const [loginUser, { loading }] = useMutation(LOGIN_USER, {
    variables: { email, password, passcode },
    onError: (error) => {
      setActErr({
        success: false,
        message: error.message || 'An unexpected error occurred, please try again.',
      });
      setCookie('token', '', -1);  // Clear cookies on error
      setCookie('user', '', -1);
    },
    onCompleted: (data) => {
      const resultData = data?.login;

      if (!resultData || resultData.code !== 202) {
        setActErr({
          success: false,
          message: resultData?.message || 'Login failed, please try again.',
        });
        return;
      }

      // Successful login - set cookies
      setCookie('token', resultData.data.token, 7);
      setCookie('user', JSON.stringify(resultData.data.user), 7);

      // Navigate based on user role
      if (resultData.data.user.role === UserRole.admin) {
        router.push('/admin/directors');
      } else if ([UserRole.captain, UserRole.co_captain].includes(resultData.data.user.role)) {
        const eventIdOfPlayer = resultData.data.user.event;
        router.push(eventIdOfPlayer ? `/${eventIdOfPlayer}/matches` : '/');
      } else {
        router.push('/');
      }
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setActErr({ success: false, message: 'Set correct email and password!' });
      return;
    }

    try {
      // Trigger the login mutation
      await loginUser();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen flex flex-col w-full justify-center items-center">
      <Login
        handleLogin={handleLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        passcode={passcode}
        setPasscode={setPasscode}
        actErr={actErr}
      />
    </div>
  );
}

export default LoginPage;
