'use client'
import React, { useMemo } from 'react';

function Footer() {

  return (
    <footer className='Footer bg-gray-800'>
      <div className='container mx-auto px-2 py-4'>
      <p>© {new Date().getFullYear()} American Spikers League . All Rights Reserved. | Privacy Policy | Terms of Service</p>
      </div>
    </footer>
  )
}

export default Footer;