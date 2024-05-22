import { IError } from '@/types';
import Image from 'next/image';
import React from 'react';

function Message({ error }: { error: IError | null }) {
  if (error === null) return null;
  return (
    <div className="text-red-500 container mx-auto bg-transparent">
      <div className="flex gap-2 items-center">
        <h2>Error: </h2> <Image width={12} height={12} src="/icons/error.svg" className="w-4 svg-white" alt="error-image" />
        <p>{error && error?.message && <p>{error.message}</p>}</p>
      </div>
    </div>
  );
}

export default Message;
