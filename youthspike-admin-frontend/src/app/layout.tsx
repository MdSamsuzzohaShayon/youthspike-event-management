import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ApolloWrapper from '@/lib/ApolloProvider';
import UserProvider, { useUser } from '@/lib/UserProvider';
import Footer from '@/components/layout/Footer';
import './globals.css';
import { Suspense } from 'react';
import LoadingPage from './loading';
import SocketProvider from '@/lib/SocketProvider';

import "../utils/polyfills";
import LdoProvider from '@/lib/LdoProvider';
import AdminMenu from '@/components/layout/AdminMenu';
import { ErrorProvider } from '@/lib/ErrorProvider';
import Message from '@/components/elements/Message';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Asl - admin',
  description: 'The purpose of Youthspike is to serve as a comprehensive and user-friendly platform for the management of sports leagues, events, teams, matches, and players. ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {



  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`} >
        <ApolloWrapper>
          <SocketProvider>
            <UserProvider>
              <LdoProvider>
                <ErrorProvider>
                  <Suspense fallback={<LoadingPage />}>
                    <Message />
                    <AdminMenu />
                    {children}
                    <div className="mt-6">
                      <Footer />
                    </div>
                  </Suspense>
                </ErrorProvider>
              </LdoProvider>
            </UserProvider>
          </SocketProvider>
        </ApolloWrapper>
      </body>
    </html>
  )
}
