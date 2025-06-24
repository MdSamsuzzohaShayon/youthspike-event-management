import { useMemo } from 'react';
import { IPlayer } from '@/types';

export default function usePlayerMaps(teamA: IPlayer[], teamB: IPlayer[]) {
  const teamAById = useMemo(() => new Map(teamA.map((p) => [p._id, p])), [teamA]);
  const teamBById = useMemo(() => new Map(teamB.map((p) => [p._id, p])), [teamB]);
  return { teamAById, teamBById };
}
