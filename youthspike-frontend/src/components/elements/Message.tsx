import { IError } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';

function Message({ error }: { error: IError | null }) {
  const [expandDetail, setExpandDetail] = useState<boolean>(false);

  if (error === null) return null;
  return (
    <div className="text-red-500 container mx-auto bg-transparent">
      <div className="flex gap-2 items-center">
        <h2>Error: </h2> <Image width={12} height={12} src="/icons/error.svg" className="w-4 svg-white" alt="error-image" />
        {error.name && <h2>{error.name}</h2>}
      </div>
      {error && error?.message && <p>{error.message}</p>}
      <div className="expand-detail mt-2">
        <button className="font-bold" type="button" onClick={() => setExpandDetail(!expandDetail)}>
          {expandDetail ? (
            <span className="flex justify-between items-center">
              Collapse <Image width={100} height={100} src="/icons/right-arrow.svg" className="svg-white w-4 rotate-180" alt="arrow" />
            </span>
          ) : (
            <span className="flex justify-between items-center">
              Expand <Image width={100} height={100} src="/icons/right-arrow.svg" className="svg-white w-4 rotate-90" alt="arrow" />
            </span>
          )}
        </button>
      </div>
      {expandDetail && (
        <div className="error-detail w-full">
          <p className="break-words">{error.main ? JSON.stringify(error.main) : JSON.stringify(error)}</p>
        </div>
      )}
    </div>
  );
}

export default Message;
