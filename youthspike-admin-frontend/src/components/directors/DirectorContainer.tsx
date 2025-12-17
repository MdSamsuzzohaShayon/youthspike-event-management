'use client';

import React, { useState, useMemo } from 'react';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import DirectorList from '@/components/ldo/DirectorList';
import Loader from '@/components/elements/Loader';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { IGetEventDirectorsQuery, ILDO, ILDOItem } from '@/types';

interface IDirectorContainerProps {
  queryRef: QueryRef<{ getEventDirectors: IGetEventDirectorsQuery }>;
}

function DirectorContainer({ queryRef }: IDirectorContainerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addNewDirector, setAddNewDirector] = useState<boolean>(false);
  
  // Use the preloaded query
  const { data } = useReadQuery(queryRef);
  
  
  const { data: ldosData } = data.getEventDirectors || {};

  // Transform the data if needed to match your existing ILDOItem interface
  const ldoList: ILDO[] = useMemo(() => {
    if (!ldosData || !Array.isArray(ldosData)) return [];
    
    // If your data structure is different from ILDOItem, transform it here
    return ldosData.map((ldo: ILDO) => ({
      ...ldo,
      _id: ldo._id,
      name: ldo.name,
      email: ldo.director?.email || null,
      // Map other properties as needed
    }));
  }, [ldosData]);

  const refetchFunc = async () => {
    // Instead of reloading the page, you can refetch the query
    // For now, keep the existing behavior, but ideally use:
    // queryRef.refetch();
    window.location.reload();
  };

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      {addNewDirector 
        ? (
          <DirectorAdd 
            setIsLoading={setIsLoading} 
            update={false} 
            setAddNewDirector={setAddNewDirector}
            refetchFunc={refetchFunc} 
          />
        ) 
        : (
          <React.Fragment>
            <DirectorList 
              ldoList={ldoList} 
              setIsLoading={setIsLoading} 
              refetchFunc={refetchFunc} 
            />
            <button 
              className="btn-info mt-4" 
              type='button' 
              onClick={() => setAddNewDirector(true)}
            >
              Add New
            </button>
          </React.Fragment>
        )
      }
    </React.Fragment>
  );
}

export default DirectorContainer;