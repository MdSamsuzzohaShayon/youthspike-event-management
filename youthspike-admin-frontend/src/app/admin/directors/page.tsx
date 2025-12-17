import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import DirectorsMain from '@/components/directors/DirectorContainer';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client/react';
import { GET_LDOS } from '@/graphql/director';
import { IGetEventDirectorsQuery } from '@/types';



export default async function DirectorsPage() {
  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='my-4 text-center'>Directors</h1>
      
      {/* Preload GraphQL query */}
      <PreloadQuery query={GET_LDOS}>
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <DirectorsMain
              queryRef={
                queryRef as QueryRef<{ getEventDirectors: IGetEventDirectorsQuery }>
              }
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}