import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { GET_LDO } from '@/graphql/director';
import LDOContainer from '@/components/ldo/LDOContainer';
import { IGetLdoResponse, TParams } from '@/types';


interface ILDOSinglePageProps {
  params: TParams;
}

export default async function LDOSinglePage({ params }: ILDOSinglePageProps) {

  const { ldoId } = await params;
  return (
    <PreloadQuery query={GET_LDO} variables={{ dId: ldoId }}>
      {(queryRef) => (
        <LDOContainer
          queryRef={
            queryRef as QueryRef<{ getEventDirector: IGetLdoResponse }>
          }
        />
      )}
    </PreloadQuery>
  );
}
