import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Script from 'next/script';

import UserProvider from '@/lib/UserProvider';
import SocketProvider from '@/lib/SocketProvider';
import LdoProvider from '@/lib/LdoProvider';
import { ErrorProvider } from '@/lib/ErrorProvider';
import ApolloWrapper from '@/lib/ApolloWrapper';

import Footer from '@/components/layout/Footer';
import AdminMenu from '@/components/layout/AdminMenu';
import Message from '@/components/elements/Message';
import Loader from '@/components/elements/Loader';

import './globals.css';
import '../utils/polyfills';
import { NODE_ENV } from '@/utils/keys';
import { EEnv } from '@/types';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Asl - admin',
  description: 'The purpose of Youthspike is to serve as a comprehensive and user-friendly platform for the management of sports leagues, events, teams, matches, and players.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Tag Manager (head) */}
        {NODE_ENV !== EEnv.development && (
          <Script
            id="gtm-head"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-M7TCRNX8');
            `,
            }}
          />
        )}
      </head>

      <body className={`${inter.className} bg-gray-900 text-white`}>
        {/* ✅ Google Tag Manager (noscript) */}
        {NODE_ENV !== EEnv.development && (
          <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M7TCRNX8" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        )}

        <Suspense fallback={<Loader />}>
          <ApolloWrapper>
            <SocketProvider>
              <UserProvider>
                <LdoProvider>
                  <ErrorProvider>
                    {/* Main content start  */}
                    <Message />
                    <AdminMenu />
                    {children}
                    <div className="mt-6">
                      <Footer />
                    </div>
                    {/* Main content end  */}
                    {/* <Suspense fallback={<LoadingPage />}>
                    </Suspense> */}
                  </ErrorProvider>
                </LdoProvider>
              </UserProvider>
            </SocketProvider>
          </ApolloWrapper>
        </Suspense>
      </body>
    </html>
  );
}
