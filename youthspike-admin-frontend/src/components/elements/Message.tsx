import { IError } from '@/types';
import React, { useState } from 'react';


const Message = ({ error }: { error: IError | null }) => {


  if (!error && error === null) return null;
  return (
    <div className={`${ error.success ? "text-gray-900" : "text-red-500"} container mx-auto`}>
      {error.message && <h3 className="flex gap-2 items-center items-start" ><span>Error:</span> <span><img src='/icons/error.svg' className='w-4 svg-white' /></span> <span>{error.message}</span> </h3> }
    </div>
  )
}

export default Message;