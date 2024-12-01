'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { containerVariants, hoverVariants, itemVariants } from '@/utils/animation';

function TermsOfService() {
  return (
    <motion.div className="bg-black min-h-screen py-12 px-4" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header Section */}
      <motion.header className="text-center mb-8" variants={itemVariants}>
        <h1 className="text-4xl font-bold text-yellow-logo">Terms of Service</h1>
        <motion.p className="text-gray-300 mt-4" variants={itemVariants}>
          Please read these terms and conditions carefully before using our website.
        </motion.p>
      </motion.header>

      {/* Terms Content */}
      <motion.div className="container mx-auto max-w-4xl bg-gray-900 shadow-lg rounded-lg p-8" variants={itemVariants}>
        <motion.div className="terms-content space-y-8" variants={containerVariants}>
          {/* Section 1 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">1. Acceptance of Agreement</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              You agree to the terms and conditions outlined in this Terms of Service Agreement with respect to our website. This Agreement constitutes the entire and only agreement between us and
              you, and supersedes all prior agreements or understandings with respect to the site.
            </motion.p>
          </motion.section>

          {/* Section 2 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">2. Changes to the Terms</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              We reserve the right to modify these terms at any time. Any such changes will be posted on this page, and your continued use of the site following the posting of changes will indicate
              your acceptance of such changes.
            </motion.p>
          </motion.section>

          {/* Section 3 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">3. Use of Site</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              Our site is provided for your personal, non-commercial use only. You may not use the site for any illegal or unauthorized purpose, and you agree to comply with all local laws regarding
              online conduct.
            </motion.p>
          </motion.section>

          {/* Section 4 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">4. Registration and User Accounts</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              To participate in certain areas of the site, you may need to create an account. You are responsible for maintaining the confidentiality of your account and password, and you agree to
              accept responsibility for all activities that occur under your account.
            </motion.p>
          </motion.section>

          {/* Section 5 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">5. Intellectual Property Rights</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              All content and materials available on this site, including but not limited to text, graphics, website name, code, and logos, are the intellectual property of the Spikeball Tournament
              and are protected by applicable copyright and trademark law.
            </motion.p>
          </motion.section>

          {/* Section 6 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">6. Termination of Use</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              We reserve the right to terminate or suspend your access to our site without notice if we believe that you have violated these terms. Upon termination, your right to use the site will
              immediately cease.
            </motion.p>
          </motion.section>

          {/* Section 7 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">7. Limitation of Liability</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              In no event shall the Spikeball Tournament or its affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with
              the use of our site.
            </motion.p>
          </motion.section>

          {/* Section 8 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">8. Governing Law</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the Spikeball Tournament is headquartered, without regard to its conflict of law
              provisions.
            </motion.p>
          </motion.section>

          {/* Section 9 */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-yellow-logo">9. Contact Information</h2>
            <motion.p className="text-gray-300 mt-2" variants={itemVariants}>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <motion.a href="mailto:american.spikers.league@gmail.com" className="text-yellow-logo underline hover:text-yellow-500 transition-all" variants={hoverVariants} whileHover="hover">
                american.spikers.league@gmail.com
              </motion.a>
              .
            </motion.p>
          </motion.section>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default TermsOfService;
