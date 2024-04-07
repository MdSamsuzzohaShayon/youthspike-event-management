import { IError } from '@/types';
import React, { useState } from 'react';


const Message = ({ error }: { error: IError | null }) => {


  if (!error && error === null) return null;
  return (
    <div className={`${ error.success ? "text-gray-900" : "text-red-500"} container mx-auto`}>
      <div className="flex gap-2 items-center">
        <h3 >Error: </h3> <img src='/icons/error.svg' className='w-4 svg-white' />
        {error.message && <h2>{error.message}</h2>}
      </div>
    </div>
  )
}

export default Message