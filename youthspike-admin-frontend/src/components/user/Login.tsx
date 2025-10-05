'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { cardAnimate, headingAnimate } from '@/utils/animation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import { LOGIN_USER } from '@/graphql/admin';
import { UserRole } from '@/types/user';
import { useError } from '@/lib/ErrorProvider';
import InputField from '../elements/forms/InputField';
import { useState } from 'react';
import { setCookie } from '@/utils/clientCookie';
import { FRONTEND_URL } from '@/utils/keys';

const { initial: hInitial, animate: hAnimate, exit: hExit } = headingAnimate;
const { initial: cInitial, animate: cAnimate, exit: cExit } = cardAnimate;

function Login() {
  const [passcodeOpener, setPasscodeOpener] = useState<boolean>(false);
  const router = useRouter();
  const { setActErr } = useError();
  const searchParams = useSearchParams();

  const matchId = searchParams.get('matchId');

  const [loginData, setLoginData] = useState<Record<string, string>>({});

  // Apollo mutation hook
  const [loginUser, { loading }] = useMutation(LOGIN_USER, {
    variables: loginData,
    onError: (error) => {
      setActErr({
        success: false,
        message: error.message || 'An unexpected error occurred, please try again.',
      });
      setCookie('token', '', -1); // Clear cookies on error
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
      if (matchId) {
        router.push(`${FRONTEND_URL}/matches/${matchId}`);
      } else if (resultData.data.user.role === UserRole.admin) {
        router.push('/admin/directors');
      } else if ([UserRole.captain, UserRole.co_captain, UserRole.player].includes(resultData.data.user.role)) {
        const eventIdOfPlayer = resultData.data.user.event;
        router.push(eventIdOfPlayer ? `/${eventIdOfPlayer}/matches` : '/');
      } else {
        router.push('/');
      }
    },
  });

  const handleInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setLoginData((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
  };

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
  };

  if (loading) return <Loader />;

  return (
    <div className="flex w-full min-h-screen">
      {/* Background SVG Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Yellow accent shapes */}
        <svg className="absolute top-0 left-0 w-32 h-32 text-yellow-400 opacity-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <svg className="absolute bottom-10 right-10 w-24 h-24 text-yellow-400 opacity-15" viewBox="0 0 100 100">
          <polygon points="50,5 95,95 5,95" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <svg className="absolute top-1/3 right-1/4 w-16 h-16 text-yellow-400 opacity-10" viewBox="0 0 100 100">
          <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        
        {/* White grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col w-full md:hidden min-h-screen px-6 py-12 relative z-10">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col items-center mb-12"
          initial={hInitial}
          animate={hAnimate}
          exit={hExit}
        >
          <div className="relative mb-6">
            <Image 
              alt="Logo" 
              src="/free-logo.png" 
              width={80} 
              height={80} 
              className="relative shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-center">
            Sign in to access your account
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div 
          className="flex-1 flex items-center justify-center"
          initial={cInitial}
          animate={cAnimate}
          exit={cExit}
        >
          <div className="w-full max-w-md">
            <form 
              onSubmit={handleLogin} 
              className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="space-y-6">
                <motion.div initial={cInitial} animate={cAnimate} exit={cExit}>
                  <InputField 
                    key="liif-1" 
                    type="text" 
                    name="email" 
                    label="Email or Username" 
                    handleInputChange={handleInputChange}
                    className="border-gray-700 text-white focus:border-yellow-400"
                  />
                </motion.div>
                
                <motion.div initial={cInitial} animate={cAnimate} exit={cExit}>
                  <InputField 
                    key="liif-2" 
                    type="password" 
                    name="password" 
                    handleInputChange={handleInputChange}
                    className="border-gray-700 text-white focus:border-yellow-400"
                  />
                </motion.div>
                
                {passcodeOpener && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <InputField 
                      key="liif-3" 
                      type="password" 
                      name="passcode" 
                      handleInputChange={handleInputChange}
                      className="border-gray-700 text-white focus:border-yellow-400"
                    />
                  </motion.div>
                )}
                
                <motion.button 
                  type="submit" 
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  initial={cInitial}
                  animate={cAnimate}
                  exit={cExit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
                
                {!passcodeOpener && (
                  <motion.p 
                    role="presentation" 
                    onClick={() => setPasscodeOpener(true)}
                    className="text-center text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors duration-200 text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    Have passcode?
                  </motion.p>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full min-h-screen relative">
        {/* Left Panel - Form */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-12">
          <div className="w-full max-w-md">
            <motion.div 
              className="text-center mb-12"
              initial={hInitial}
              animate={hAnimate}
              exit={hExit}
            >
              <div className="relative inline-block mb-6">
                <Image 
                  alt="Logo" 
                  src="/free-logo.png" 
                  width={100} 
                  height={100} 
                  className="relative shadow-2xl"
                />
              </div>
              <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-400 text-lg">
                Sign in to your administrator account
              </p>
            </motion.div>

            <motion.div 
              initial={cInitial}
              animate={cAnimate}
              exit={cExit}
              className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 shadow-2xl"
            >
              <form onSubmit={handleLogin} className="space-y-6">
                <motion.div initial={cInitial} animate={cAnimate} exit={cExit}>
                  <InputField 
                    key="liif-1" 
                    type="text" 
                    name="email" 
                    label="Email or Username" 
                    handleInputChange={handleInputChange}
                    className="border-gray-700 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </motion.div>
                
                <motion.div initial={cInitial} animate={cAnimate} exit={cExit}>
                  <InputField 
                    key="liif-2" 
                    type="password" 
                    name="password" 
                    handleInputChange={handleInputChange}
                    className="border-gray-700 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </motion.div>
                
                {passcodeOpener && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InputField 
                      key="liif-3" 
                      type="password" 
                      name="passcode" 
                      handleInputChange={handleInputChange}
                      className="border-gray-700 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    />
                  </motion.div>
                )}
                
                <motion.button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-2xl text-lg"
                  initial={cInitial}
                  animate={cAnimate}
                  exit={cExit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
                
                {!passcodeOpener && (
                  <motion.p 
                    role="presentation" 
                    onClick={() => setPasscodeOpener(true)}
                    className="text-center text-yellow-400 hover:text-yellow-300 cursor-pointer transition-all duration-200 font-medium hover:underline"
                    whileHover={{ scale: 1.05 }}
                  >
                    Have passcode?
                  </motion.p>
                )}
              </form>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Visual */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black border-l border-gray-800 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <svg className="w-full h-full text-yellow-400/10" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="currentColor"/>
              <circle cx="80" cy="20" r="15" fill="currentColor" opacity="0.05"/>
              <rect x="60" y="70" width="30" height="30" fill="currentColor" opacity="0.03" transform="rotate(45 75 85)"/>
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="max-w-lg"
            >
              <div className="mb-8">
                <div className="w-20 h-20 bg-yellow-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                  <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  League Director Access
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Manage tournaments, teams, and matches with powerful administrative tools designed for sports professionals.
                </p>
              </div>
              
              <div className="flex justify-center space-x-8 mt-12">
                {['Admin', 'Director', 'Captain', 'Co-Captain', 'Player'].map((role, index) => (
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-medium">{role}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
