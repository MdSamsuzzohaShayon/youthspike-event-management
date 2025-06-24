import { INetRelatives } from '@/types';
import { useMemo } from 'react';

export default function useNetMaps(currentRoundNets: INetRelatives[]) {
  return useMemo(
    () => new Map(currentRoundNets.map((n) => [n.num, n])),
    [currentRoundNets],
  );
}
