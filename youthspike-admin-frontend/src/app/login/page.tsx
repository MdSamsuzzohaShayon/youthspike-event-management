import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import Login from '@/components/user/Login';
import { LOGIN_USER } from '@/graphql/admin';
import { UserRole } from '@/types/user';
import { setCookie } from '@/utils/cookie';
import { useError } from '@/lib/ErrorContext';

function LoginPage() {


  return (
    <div className="min-h-screen flex flex-col w-full justify-center items-center">
      <Login />
    </div>
  );
}

export default LoginPage;
