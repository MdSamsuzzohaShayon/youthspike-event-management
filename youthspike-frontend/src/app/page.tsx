import Head from 'next/head';
import React from 'react';

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
      <h1>Matches</h1>

    </div>
  )
}

export default HomePage;