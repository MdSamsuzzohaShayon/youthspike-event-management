import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import ApolloWrapper from '@/lib/ApolloWrapper';
import ReduxProvider from '@/lib/ReduxProviders';
import './globals.css';
import Footer from '@/components/layout/Footer';
import UserProvider from '@/lib/UserProvider';
import SocketProvider from '@/lib/SocketProvider';
import Loader from '@/components/elements/Loader';
import LdoProvider from '@/lib/LdoProvider';
import MenuSwitcher from '@/components/layout/MenuSwitcher';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Youthspike - Running the match</title>
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
                    <MenuSwitcher />
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
