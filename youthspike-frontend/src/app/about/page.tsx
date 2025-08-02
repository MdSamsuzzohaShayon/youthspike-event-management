'use client';

import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import React, { useEffect } from 'react';
import LocalStorageService from '@/utils/LocalStorageService';

function AboutPage() {
  useEffect(() => {
    const eventExist = LocalStorageService.getEvent();
    if (eventExist && eventExist !== '') {
      LocalStorageService.removeEvent();
      window.location.reload();
    }
  }, []);

  return (
    <div className="bg-black text-white min-h-screen animate-fadeIn">
      {/* Header Section */}
      <header className="text-center py-8 animate-slideUp">
        <h1 className="text-4xl font-bold">About Us</h1>
        <p className="text-lg mt-2">
          Learn more about our platform and how we empower teams to excel.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        {/* Navigation Menu */}
        <nav className="bg-yellow-logo rounded-md shadow-md my-6 animate-slideUp">
          <ul className="flex justify-around py-4">
            <li>
              <a
                href={ADMIN_FRONTEND_URL}
                className="text-black font-semibold hover:text-white transition-colors duration-300"
              >
                Admin Settings
              </a>
            </li>
            <li>
              <a
                href="/"
                className="text-black font-semibold hover:text-white transition-colors duration-300"
              >
                Public View
              </a>
            </li>
            <li>
              <a
                href="/events"
                className="text-black font-semibold hover:text-white transition-colors duration-300"
              >
                Events
              </a>
            </li>
          </ul>
        </nav>

        {/* Features Section */}
        <section className="bg-gray-800 border-l-4 border-yellow-logo rounded-md p-6 my-6 shadow-md animate-slideUp">
          <h2 className="text-xl font-semibold text-yellow-logo">Key Features</h2>
          <ul className="list-disc list-inside mt-4 space-y-2 text-white">
            <li className="hover:text-yellow-logo transition-colors duration-300 cursor-pointer">
              Live event management with detailed records
            </li>
            <li className="hover:text-yellow-logo transition-colors duration-300 cursor-pointer">
              Seamless roster locking and match creation
            </li>
            <li className="hover:text-yellow-logo transition-colors duration-300 cursor-pointer">
              Team ranking based on performance
            </li>
            <li className="hover:text-yellow-logo transition-colors duration-300 cursor-pointer">
              Admin and public view consistency
            </li>
          </ul>
        </section>

        {/* Standings and Groups Section */}
        <section className="bg-gray-800 border-l-4 border-yellow-logo rounded-md p-6 my-6 shadow-md animate-slideUp">
          <h2 className="text-xl font-semibold text-yellow-logo">Standings & Group Management</h2>
          <p className="mt-4 text-white">
            Manage team standings, group filtering, and bulk actions for streamlined operations.
          </p>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;
