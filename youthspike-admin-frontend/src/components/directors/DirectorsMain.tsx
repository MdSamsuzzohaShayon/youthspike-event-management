'use client'

import DirectorAdd from '@/components/ldo/DirectorAdd';
import DirectorList from '@/components/ldo/DirectorList';
import Loader from '@/components/elements/Loader';
import React, { useState } from 'react';
import { ILDO, ILDOItem } from '@/types';

interface IDirectorsMainProps{
    ldoList: ILDOItem[];
}
async function DirectorsMain({ldoList}: IDirectorsMainProps) {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addNewDirector, setAddNetDirector] = useState<boolean>(false);
  /**
   * Show list of directors
   */

  const refetchFunc=async ()=>{
    window.location.reload();
  }

  if (isLoading) return <Loader />;


  return (
    <React.Fragment>
      {addNewDirector 
      ? <DirectorAdd setIsLoading={setIsLoading} update={false} setAddNetDirector={setAddNetDirector} refetchFunc={refetchFunc} /> 
      : (<React.Fragment>
        <DirectorList ldoList={ldoList} setIsLoading={setIsLoading} referchFunc={refetchFunc} />
        <button className="btn-info mt-4" type='button' onClick={() => setAddNetDirector(true)}>Add New</button>
      </React.Fragment>)}
    </React.Fragment>
  )
}

export default DirectorsMain;