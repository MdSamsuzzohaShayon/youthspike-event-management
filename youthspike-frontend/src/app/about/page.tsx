'use client';

import { motion } from 'framer-motion';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import React, { useEffect } from 'react';
import { containerVariants, hoverVariants, itemVariants } from '@/utils/animation';
import { getEvent, removeEvent } from '@/utils/localStorage';

function AboutPage() {
  useEffect(() => {
    const eventExist = getEvent();
    if (eventExist && eventExist !== '') {
      removeEvent();
      window.location.reload();
    }
  }, []);
  return (
    <motion.div className="bg-black text-white min-h-screen" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header Section */}
      <motion.header className="text-center py-8" variants={itemVariants}>
        <h1 className="text-4xl font-bold">About Us</h1>
        <p className="text-lg mt-2">Learn more about our platform and how we empower teams to excel.</p>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        {/* Navigation Menu */}
        <motion.nav className="bg-yellow-logo rounded-md shadow-md my-6" variants={itemVariants}>
          <ul className="flex justify-around py-4">
            <motion.li variants={hoverVariants} whileHover="hover">
              <a href={ADMIN_FRONTEND_URL} className="text-black font-semibold hover:text-white">
                Admin Settings
              </a>
            </motion.li>
            <motion.li variants={hoverVariants} whileHover="hover">
              <a href="/" className="text-black font-semibold hover:text-white">
                Public View
              </a>
            </motion.li>
            <motion.li variants={hoverVariants} whileHover="hover">
              <a href="/events" className="text-black font-semibold hover:text-white">
                Events
              </a>
            </motion.li>
          </ul>
        </motion.nav>

        {/* Features Section */}
        <motion.section className="bg-gray-800 border-l-4 border-yellow-logo rounded-md p-6 my-6 shadow-md" variants={itemVariants}>
          <h2 className="text-xl font-semibold text-yellow-logo">Key Features</h2>
          <motion.ul className="list-disc list-inside mt-4 space-y-2 text-white" variants={containerVariants}>
            <motion.li variants={itemVariants} whileHover="hover">
              Live event management with detailed records
            </motion.li>
            <motion.li variants={itemVariants} whileHover="hover">
              Seamless roster locking and match creation
            </motion.li>
            <motion.li variants={itemVariants} whileHover="hover">
              Team ranking based on performance
            </motion.li>
            <motion.li variants={itemVariants} whileHover="hover">
              Admin and public view consistency
            </motion.li>
          </motion.ul>
        </motion.section>

        {/* Standings and Groups Section */}
        <motion.section className="bg-gray-800 border-l-4 border-yellow-logo rounded-md p-6 my-6 shadow-md" variants={itemVariants}>
          <h2 className="text-xl font-semibold text-yellow-logo">Standings & Group Management</h2>
          <motion.p variants={itemVariants} className="mt-4 text-white">
            Manage team standings, group filtering, and bulk actions for streamlined operations.
          </motion.p>
        </motion.section>
      </main>
    </motion.div>
  );
}

export default AboutPage;
