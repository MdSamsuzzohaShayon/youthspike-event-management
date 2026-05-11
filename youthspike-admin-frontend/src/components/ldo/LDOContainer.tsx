'use client'


import { IGetLdoResponse, ILDO } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import DirectorAdd from './DirectorAdd';

interface ILDOContainerProps {
    queryRef: QueryRef<{ getEventDirector: IGetLdoResponse }>;
}

function LDOContainer({ queryRef }: ILDOContainerProps) {

    const { data } = useReadQuery(queryRef);


    const prevLdo = (data?.getEventDirector?.data as ILDO) || null;
    const ldoId = data?.getEventDirector?.data?._id || null;
    

    return (
        <div>
            <DirectorAdd update prevLdo={prevLdo} ldoId={ldoId} />
        </div>
    )
}

export default LDOContainer;