'use client';

import Image from 'next/image';
import { useEffect } from 'react';
// import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6">
      <div className="bg-red-900/20 border border-red-700 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          {/* <AlertTriangle className="text-yellow-400 w-12 h-12" /> */}
          <Image src="/icons/alert.svg" height={50} width={50} alt="alert-icon" className="w-16 svg-white" />
        </div>
        <h1 className="text-3xl font-bold text-yellow-300 mb-2">{error?.name || "Oops! Something went wrong."}</h1>
        <p className="text-white/80 text-sm mb-4">{error.message}</p>
        {error.digest && <p className="text-white/40 text-xs mb-4">Error ID: {error.digest}</p>}
        <button onClick={reset} className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded-full transition-colors duration-200">
          Try Again
        </button>
      </div>
    </div>
  );
}
