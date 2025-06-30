'use client';

import React, { useState } from 'react';
import DirectorAdd from './DirectorAdd';
import { IDirector, ILDO } from '@/types';

interface LDOSingleMainProps {
  ldo: ILDO;
  ldoId: string;
}

function LDOSingleMain({ ldo, ldoId }: LDOSingleMainProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetchFunc = async () => {
    window.location.reload();
  };

  return (
    <React.Fragment>
      <DirectorAdd setIsLoading={setIsLoading} update prevLdo={ldo} ldoId={ldoId} refetchFunc={refetchFunc} />
    </React.Fragment>
  );
}

export default LDOSingleMain;
