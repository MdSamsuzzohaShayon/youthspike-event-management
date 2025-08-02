import React from 'react';

function TermsOfService() {
  return (
    <div className="bg-black min-h-screen py-12 px-4 animate-fadeIn">
      {/* Header Section */}
      <header className="text-center mb-8 animate-slideUp">
        <h1 className="text-4xl font-bold text-yellow-logo">Terms of Service</h1>
        <p className="text-gray-300 mt-4 animate-slideUp delay-100">
          Please read these terms and conditions carefully before using our website.
        </p>
      </header>

      {/* Terms Content */}
      <div className="container mx-auto max-w-4xl bg-gray-900 shadow-lg rounded-lg p-8 animate-slideUp delay-200">
        <div className="terms-content space-y-8">
          {/* Section 1 */}
          <section className="animate-slideUp delay-300">
            <h2 className="text-xl font-semibold text-yellow-logo">1. Acceptance of Agreement</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-400">
              You agree to the terms and conditions outlined in this Terms of Service Agreement with respect to our website. This Agreement constitutes the entire and only agreement between us and
              you, and supersedes all prior agreements or understandings with respect to the site.
            </p>
          </section>

          {/* Section 2 */}
          <section className="animate-slideUp delay-500">
            <h2 className="text-xl font-semibold text-yellow-logo">2. Changes to the Terms</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-600">
              We reserve the right to modify these terms at any time. Any such changes will be posted on this page, and your continued use of the site following the posting of changes will indicate
              your acceptance of such changes.
            </p>
          </section>

          {/* Section 3 */}
          <section className="animate-slideUp delay-700">
            <h2 className="text-xl font-semibold text-yellow-logo">3. Use of Site</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-800">
              Our site is provided for your personal, non-commercial use only. You may not use the site for any illegal or unauthorized purpose, and you agree to comply with all local laws regarding
              online conduct.
            </p>
          </section>

          {/* Section 4 */}
          <section className="animate-slideUp delay-900">
            <h2 className="text-xl font-semibold text-yellow-logo">4. Registration and User Accounts</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-1000">
              To participate in certain areas of the site, you may need to create an account. You are responsible for maintaining the confidentiality of your account and password, and you agree to
              accept responsibility for all activities that occur under your account.
            </p>
          </section>

          {/* Section 5 */}
          <section className="animate-slideUp delay-1100">
            <h2 className="text-xl font-semibold text-yellow-logo">5. Intellectual Property Rights</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-1200">
              All content and materials available on this site, including but not limited to text, graphics, website name, code, and logos, are the intellectual property of the Spikeball Tournament
              and are protected by applicable copyright and trademark law.
            </p>
          </section>

          {/* Section 6 */}
          <section className="animate-slideUp delay-1300">
            <h2 className="text-xl font-semibold text-yellow-logo">6. Termination of Use</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-1400">
              We reserve the right to terminate or suspend your access to our site without notice if we believe that you have violated these terms. Upon termination, your right to use the site will
              immediately cease.
            </p>
          </section>

          {/* Section 7 */}
          <section className="animate-slideUp delay-1500">
            <h2 className="text-xl font-semibold text-yellow-logo">7. Limitation of Liability</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-1600">
              In no event shall the Spikeball Tournament or its affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with
              the use of our site.
            </p>
          </section>

          {/* Section 8 */}
          <section className="animate-slideUp delay-1700">
            <h2 className="text-xl font-semibold text-yellow-logo">8. Governing Law</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-1800">
              This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the Spikeball Tournament is headquartered, without regard to its conflict of law
              provisions.
            </p>
          </section>

          {/* Section 9 */}
          <section className="animate-slideUp delay-1900">
            <h2 className="text-xl font-semibold text-yellow-logo">9. Contact Information</h2>
            <p className="text-gray-300 mt-2 animate-slideUp delay-2000">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a 
                href="mailto:american.spikers.league@gmail.com" 
                className="text-yellow-logo underline hover:text-yellow-500 transition-all duration-300"
              >
                american.spikers.league@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;