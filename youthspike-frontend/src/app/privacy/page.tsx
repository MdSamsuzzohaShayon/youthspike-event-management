import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="bg-black text-white min-h-screen animate-fadeIn">
      <div className="container mx-auto max-w-5xl bg-gray-700 shadow-lg rounded-lg p-8">
        <h1 className="text-yellow-logo text-4xl font-bold text-center mb-6 ">Privacy Policy</h1>

        <p className="text-gray-300 mb-4">
          Welcome to the Spikeball Tournament’s Privacy Policy. This policy outlines how we collect, use, and protect your personal data when you use our website or participate in our tournaments.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-gray-300 mb-4">
          We may collect various types of personal information, including but not limited to your name, email address, phone number, and tournament preferences when you sign up or contact us.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-300 mb-4">
          The information we collect is used to provide and improve our services, including managing your participation in Spikeball tournaments, processing payments, sending notifications, and
          responding to your inquiries.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">3. Data Security</h2>
        <p className="text-gray-300 mb-4">
          We implement security measures to protect your data from unauthorized access or disclosure. However, please note that no online service can guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">4. Third-Party Sharing</h2>
        <p className="text-gray-300 mb-4">
          We do not sell or share your personal data with third parties, except as necessary to fulfill our services (e.g., payment processors) or comply with legal obligations.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">5. Cookies</h2>
        <p className="text-gray-300 mb-4">
          Our website may use cookies to improve your experience by remembering your preferences and providing relevant information during your visits. You can disable cookies in your browser settings
          if preferred.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">6. Your Rights</h2>
        <p className="text-gray-300 mb-4">
          You have the right to access, update, or delete your personal information. If you have any concerns about how we handle your data, please contact us at american.spikers.league@gmail.com.
        </p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">7. Changes to This Policy</h2>
        <p className="text-gray-300 mb-4">We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we encourage you to review it regularly.</p>

        <h2 className="text-xl font-semibold text-yellow-logo mt-8 mb-4">8. Contact Us</h2>
        <p className="text-gray-300 mb-4">
          If you have any questions or concerns about this Privacy Policy or our data practices, feel free to contact us at{' '}
          <a href="mailto:american.spikers.league@gmail.com" className="text-blue-500 underline">
            american.spikers.league@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
