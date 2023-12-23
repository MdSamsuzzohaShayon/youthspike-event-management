import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ApolloWrapper from '@/lib/ApolloWrapper';
import ReduxProvider from '@/lib/ReduxProviders';
import './globals.css';
import Menu from '@/components/layout/Menu';
import Footer from '@/components/layout/Footer';
import UserProvider from '@/lib/UserProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Youthspike',
  description: 'Welcome to Youthspike, where sports enthusiasts and teams unite for an unparalleled sports management experience! Youthspike is a comprehensive platform designed to enhance the way you organize, participate in, and enjoy sports events. From leagues and tournaments to player management and match coordination, Youthspike simplifies the complexities of sports administration, bringing a new level of efficiency and excitement to your sporting endeavors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <ApolloWrapper>
          <UserProvider>
            <ReduxProvider>
              <Menu />
              {children}
              <Footer />
            </ReduxProvider>
          </UserProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
