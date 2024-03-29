'use client'

import Head from 'next/head';
import LDOMainPage from '@/components/ldo/MainPage';
import EventMainPage from '@/components/event/EventMainPage';

function HomePage() {
  return (
    <div className='event-wrapper w-full'>
      <EventMainPage />
    </div>
  )
}

export default HomePage;