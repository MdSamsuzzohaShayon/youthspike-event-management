'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cardAnimate, headingAnimate } from '@/utils/animation';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import { LOGIN_USER } from '@/graphql/admin';
import { UserRole } from '@/types/user';
import { setCookie } from '@/utils/cookie';
import { useError } from '@/lib/ErrorContext';
import InputField from '../elements/forms/InputField';
import { useState } from 'react';

const { initial: hInitial, animate: hAnimate, exit: hExit, transition: hTransition } = headingAnimate;
const { initial: cInitial, animate: cAnimate, exit: cExit, transition: cTransition } = cardAnimate;



function Login() {
    const [passcodeOpener, setPasscodeOpener] = useState<boolean>(false);
    const router = useRouter();
    const { setActErr } = useError();
  
    const [loginData, setLoginData] = useState<Record<string, string>>({});
  
    // Apollo mutation hook
    const [loginUser, { loading }] = useMutation(LOGIN_USER, {
      variables: loginData,
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
  

  
    const handleInputChange= (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLInputElement;
        setLoginData((prevState)=>({ ...prevState, [inputEl.name]: inputEl.value }));
    }
    
    const handleLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!loginData?.email || !loginData?.password) {
            setActErr({ success: false, message: 'Set correct email and password!' });
            return;
          }
      
          try {
            // Trigger the login mutation
            await loginUser();
          } catch (error) {
            console.error('Login error:', error);
          }

    }

    if (loading) return <Loader />;

    return (
        <div className="flex w-full min-h-screen bg-yellow-gradient">
            <div className="flex flex-col items-center justify-center w-full md:w-1/2 px-6 py-12 md:py-0">
                <motion.h1
                    className="text-4xl font-bold text-white mb-6"
                    initial={hInitial}
                    animate={hAnimate}
                    exit={hExit}
                    transition={{ ...hTransition, delay: 0.3 }}
                >
                    Login
                </motion.h1>
                <div className="w-full md:w-4/6">
                    <motion.div
                        initial={cInitial}
                        animate={cAnimate}
                        exit={cExit}
                        transition={{ ...cTransition, delay: 0.5 }}
                        className="flex justify-center mb-6"
                    >
                        <Image alt="Logo" src="/free-logo.png" width={80} height={80} className="rounded-full shadow-md" />
                    </motion.div>
                    <form
                        onSubmit={handleLogin}
                        className="flex flex-col gap-4 bg-gray-900 p-8 rounded-lg shadow-lg bg-gray-gradient"
                    >
                        <motion.div
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 0.6 }}
                        >
                            <InputField key="liif-1" type='text' name='email' handleInputChange={handleInputChange} value="" />
                        </motion.div>
                        <motion.div
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 0.8 }}
                        >
                            <InputField key="liif-2" type='password' name='password' handleInputChange={handleInputChange} />
                        </motion.div>
                        {passcodeOpener && (
                            <motion.div
                                initial={cInitial}
                                animate={cAnimate}
                                exit={cExit}
                                transition={{ ...cTransition, delay: 1.0 }}
                            >
                                <InputField key="liif-3" type='password' name='passcode' handleInputChange={handleInputChange} />
                            </motion.div>
                        )}
                        <motion.button
                            type="submit"
                            className="w-full btn-info"
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 1.2 }}
                        >
                            Submit
                        </motion.button>
                        {!passcodeOpener && <p role='presentation' onClick={(e)=> setPasscodeOpener(true)}>Have passcode?</p>}
                    </form>
                </div>
            </div>
            <div className="hidden md:flex md:w-1/2 items-center justify-center relative bg-white">
                <motion.h1
                    className="absolute top-1/2 transform -translate-y-1/2 text-xl font-semibold text-white z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    Access as Admin to League Director
                </motion.h1>
                <div className="w-full h-screen overflow-hidden">
                    <img src="/login-bg.jpg" alt="Login background" className="object-cover w-full h-full" />
                </div>
            </div>
        </div>
    );
}

export default Login;
