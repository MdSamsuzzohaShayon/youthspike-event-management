'use client'

import Head from 'next/head';
import LDOMainPage from '@/components/ldo/MainPage';

function HomePage() {
  return (
    <div className='container mx-auto px-2'>
      <Head>
        <title>Youthspike : Your Ultimate Spikeball Experience</title>
        <meta
          name="description"
          content="ASL Squads"
          key="desc"
        />
      </Head>
      <LDOMainPage />
    </div>
  )
}

export default HomePage;