'use client'


import { IGetLdoResponse, ILDO } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import DirectorAdd from './DirectorAdd';

interface ILDOContainerProps {
    queryRef: QueryRef<{ getEventDirector: IGetLdoResponse }>;
}

function LDOContainer({ queryRef }: ILDOContainerProps) {

    const { data } = useReadQuery(queryRef);

    return (
        <div>
            <DirectorAdd update prevLdo={(data?.getEventDirector?.data as ILDO) || null} ldoId={data?.getEventDirector?.data?._id} />
        </div>
    )
}

export default LDOContainer;