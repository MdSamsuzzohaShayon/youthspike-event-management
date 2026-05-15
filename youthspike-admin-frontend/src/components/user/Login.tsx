'use client';

import Image from 'next/image';
import { cardAnimate, headingAnimate } from '@/utils/animation';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/elements/Loader';
import { LOGIN_USER } from '@/graphql/admin';
import { ILoginResponse, IUserContext, UserRole } from '@/types/user';
import { useMessage } from '@/lib/MessageProvider';
import InputField from '../elements/forms/InputField';
import { useState, useCallback, useMemo } from 'react';
import { setCookie } from '@/utils/clientCookie';
import { FRONTEND_URL } from '@/utils/keys';
import { useMutation } from '@apollo/client/react';

interface LoginFormData {
  email: string;
  password: string;
  passcode?: string;
}

const { initial: headingInitial, animate: headingAnimateState, exit: headingExit } = headingAnimate;
const { initial: cardInitial, animate: cardAnimateState, exit: cardExit } = cardAnimate;

// Extracted SVG Background Component
const BackgroundSVG = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <svg className="absolute top-0 left-0 w-32 h-32 text-yellow-400 opacity-20" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
    <svg className="absolute bottom-10 right-10 w-24 h-24 text-yellow-400 opacity-15" viewBox="0 0 100 100">
      <polygon points="50,5 95,95 5,95" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
    <svg className="absolute top-1/3 right-1/4 w-16 h-16 text-yellow-400 opacity-10" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>

    <div className="absolute inset-0 opacity-[0.02]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  </div>
);

// Extracted Desktop Visual Panel Component
const DesktopVisualPanel = () => {
  const userRoles = ['Admin', 'Director', 'Captain', 'Co-Captain', 'Player'];

  return (
    <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black border-l border-gray-800 overflow-hidden">
      <div className="absolute inset-0">
        <svg className="w-full h-full text-yellow-400/10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="currentColor" />
          <circle cx="80" cy="20" r="15" fill="currentColor" opacity="0.05" />
          <rect x="60" y="70" width="30" height="30" fill="currentColor" opacity="0.03" transform="rotate(45 75 85)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <div className="w-20 h-20 bg-yellow-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">League Director Access</h2>
            <p className="text-gray-400 text-lg leading-relaxed">Manage tournaments, teams, and matches with powerful administrative tools designed for sports professionals.</p>
          </div>

          <div className="flex justify-center space-x-8 mt-12">
            {userRoles.map((role, index) => (
              <div key={role} className="text-center">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted Header Component
const HeaderSection = ({ isMobile = false }: { isMobile?: boolean }) => (
  <div className={`flex flex-col items-center mb-12 ${isMobile ? '' : 'text-center mb-12'}`} >
    <div className="relative mb-6">
      <Image alt="League Logo" src="/free-logo.png" width={isMobile ? 80 : 100} height={isMobile ? 80 : 100} className="relative shadow-lg" priority />
    </div>
    <h1 className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold text-white mb-2 ${!isMobile && 'bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent'}`}>Welcome Back</h1>
    <p className="text-gray-400">{isMobile ? 'Sign in to access your account' : 'Sign in to your administrator account'}</p>
  </div>
);

// Extracted Login Form Component
const LoginForm = ({
  showPasscodeField,
  onTogglePasscode,
  onSubmit,
  onChange,
}: {
  showPasscodeField: boolean;
  onTogglePasscode: () => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  onChange: (name: string, value: string) => void;
}) => {
  const handleInputChange = useCallback(
    (e: React.SyntheticEvent) => {
      const { name, value } = e.target as HTMLInputElement;
      onChange(name, value);
    },
    [onChange],
  );

  const inputClassName = 'border-gray-700 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div >
        <InputField type="text" name="email" label="Email or Username" onChange={handleInputChange} className={inputClassName} />
      </div>

      <div >
        <InputField type="password" name="password" label="Password" onChange={handleInputChange} className={inputClassName} />
      </div>

      {showPasscodeField && (
        <div>
          <InputField type="password" name="passcode" label="Passcode" onChange={handleInputChange} className={inputClassName} />
        </div>
      )}

      <button type="submit" className="w-full btn-info" >
        Sign In
      </button>

      {!showPasscodeField && (
        <p
          role="button"
          onClick={onTogglePasscode}
          className="text-center text-yellow-logo hover:text-yellow-300 cursor-pointer transition-all duration-200 font-medium hover:underline"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onTogglePasscode()}
        >
          Have passcode?
        </p>
      )}
    </form>
  );
};

function LoginPage() {
  const [showPasscodeField, setShowPasscodeField] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    passcode: '',
  });

  const router = useRouter();
  const { setMessage } = useMessage();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const handleFormChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const navigateAfterLogin = useCallback(
    (loggedUser: IUserContext) => {
      if (!loggedUser.info) {
        console.error("No info in the user!");

        return;
      }
      const userRole = loggedUser.info.role
      if (matchId) {
        router.push(`${FRONTEND_URL}/matches/${matchId}`);
      } else if (loggedUser.info.role === UserRole.admin) {
        router.push('/admin/directors');
      } else if (loggedUser?.info?.teamId && [UserRole.captain, UserRole.co_captain, UserRole.player].includes(userRole)) {
        // router.push(eventIdOfPlayer ? `/${eventIdOfPlayer}/matches` : '/');
        router.push(`/teams/${loggedUser.info.teamId}/roster`);
      } else {
        router.push('/');
      }
    },
    [matchId, router],
  );

  const [loginUser, { loading: isLoading }] = useMutation<{ login: ILoginResponse }>(LOGIN_USER, {
    variables: formData,
    onError: (error) => {
      setMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred, please try again.',
      });
      // Clear cookies on error
      setCookie('token', '', -1);
      setCookie('user', '', -1);
    },
    onCompleted: (data) => {
      const resultData = data.login;

      if (!resultData || resultData.code !== 202) {
        setMessage({
          type: 'error',
          message: resultData?.message || 'Login failed, please try again.',
        });
        return;
      }

      // Successful login - set cookies
      if (resultData?.data?.token) setCookie('token', resultData?.data?.token, 7);
      if (resultData?.data?.info) {
        setCookie('user', JSON.stringify(resultData.data.info), 7);
        if (resultData?.data?.info) navigateAfterLogin(resultData.data);
      }

      // Navigate based on user role
    },
  });

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();

      if (!formData.email || !formData.password) {
        setMessage({ type: 'error', message: 'Please enter your email and password!' });
        return;
      }

      try {
        await loginUser();
      } catch (error) {
        // Error is already handled in onError callback
        console.error('Login submission error:', error);
      }
    },
    [formData, loginUser, setMessage],
  );

  const togglePasscodeField = useCallback(() => {
    setShowPasscodeField((prev) => !prev);
  }, []);

  const formContainerClass = useMemo(() => 'bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl', []);

  if (isLoading) return <Loader />;

  return (
    <div className="flex w-full min-h-screen">
      <BackgroundSVG />

      {/* Mobile Layout */}
      <div className="flex flex-col w-full md:hidden min-h-screen px-6 py-12 relative z-10">
        <HeaderSection isMobile />

        <div className="flex-1 flex items-center justify-center" >
          <div className="w-full max-w-md">
            <div className={formContainerClass}>
              <LoginForm showPasscodeField={showPasscodeField} onTogglePasscode={togglePasscodeField} onSubmit={handleSubmit} onChange={handleFormChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full min-h-screen relative">
        {/* Left Panel - Form */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-12">
          <div className="w-full max-w-md">
            <HeaderSection />

            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 shadow-2xl">
              <LoginForm showPasscodeField={showPasscodeField} onTogglePasscode={togglePasscodeField} onSubmit={handleSubmit} onChange={handleFormChange} />
            </div>
          </div>
        </div>

        <DesktopVisualPanel />
      </div>
    </div>
  );
}

export default LoginPage;
