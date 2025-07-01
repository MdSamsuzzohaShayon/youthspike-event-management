'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useError } from '@/lib/ErrorContext';
import { toastVariants } from '@/utils/animation';

// Error Object Interface
export interface IError {
  message: string;
}

// Redux State Interface
export interface ElementsState {
  actErr: IError | null;
}

const TEN_SECONDS = 10 * 1000;

function Message() {
  const { actErr } = useError();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    let timer = null;

    if (actErr?.message) {
      setIsVisible(true);
      timer = setTimeout(() => {
        setIsVisible(false);
      }, TEN_SECONDS); // Auto-hide after 5 seconds
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [actErr]);

  if (!actErr || !actErr.message) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed top-5 right-5 md:right-10 z-50 w-full max-w-sm"
        >
          <div className="flex items-center gap-4 bg-red-100 text-red-900 border-l-4 border-red-500 px-5 py-4 rounded-md shadow-lg">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Image src="/icons/error.svg" width={24} height={24} alt="Error Icon" className="w-6 h-6" />
            </div>

            {/* Message Content */}
            <div className="flex-1">
              <h2 className="font-bold text-lg">Something went wrong</h2>
              <p className="text-sm">{actErr.message}</p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full"
              aria-label="Close Toast"
            >
              ✖️
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Message;
