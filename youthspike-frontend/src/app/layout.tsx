import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import ReduxProvider from '@/lib/ReduxProviders';
import './globals.css';
import Footer from '@/components/layout/Footer';
import UserProvider from '@/lib/UserProvider';
import SocketProvider from '@/lib/SocketProvider';
import Loader from '@/components/elements/Loader';
import LdoProvider from '@/lib/LdoProvider';
import MenuSwitcher from '@/components/layout/MenuSwitcher';
import Message from '@/components/elements/Message';
import { cookies } from 'next/headers';
import { ACCESS_CODE } from '@/utils/constant';
import ApolloWrapper from '@/lib/ApolloWrapper';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const cookieStore = await cookies();
  const accessCodeCookie = cookieStore.get(ACCESS_CODE);
  const accessCodeList = accessCodeCookie
    ? JSON.parse(accessCodeCookie.value)
    : [];

  return (
    <html lang="en">
      <head>
        <title>ASL - MatchPlay</title>
        <meta
          name="description"
          content="Welcome to Youthspike, where sports enthusiasts and teams unite for an unparalleled sports management experience! Youthspike is a comprehensive platform designed to enhance the way you organize, participate in, and enjoy sports events. From leagues and tournaments to player management and match coordination, Youthspike simplifies the complexities of sports administration, bringing a new level of efficiency and excitement to your sporting endeavors."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-black-logo text-white`}>
        <Suspense fallback={<Loader />}>
          <SocketProvider>
            <ApolloWrapper>
              <UserProvider>
                <ReduxProvider>
                  <LdoProvider>
                    <Message />
                    <MenuSwitcher accessCodeList={accessCodeList} />
                    {children}
                    <Footer />
                  </LdoProvider>
                </ReduxProvider>
              </UserProvider>
            </ApolloWrapper>
          </SocketProvider>
        </Suspense>
      </body>
    </html>
  );
}
