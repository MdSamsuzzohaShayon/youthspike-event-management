'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error captured in error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-[#1a1a1a] border border-red-600 shadow-lg rounded-2xl p-8 max-w-lg w-full text-center text-white">
        <h1 className="text-3xl font-extrabold text-red-500 mb-4">⚠️ Something went wrong!</h1>
        
        <p className="text-gray-200 mb-4">
          {error.message || 'An unexpected error occurred. Please try again later.'}
        </p>

        {error.digest && (
          <p className="text-sm text-gray-400 mb-4">Error Code: {error.digest}</p>
        )}

        <button
          onClick={() => reset()}
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
