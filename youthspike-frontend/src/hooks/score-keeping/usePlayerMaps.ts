import { useMemo } from 'react';
import { IPlayer } from '@/types';

export default function usePlayerMaps(teamAPlayers: IPlayer[], teamBPlayers: IPlayer[]) {
  const teamAById = useMemo(() => new Map(teamAPlayers.map((p) => [p._id, p])), [teamAPlayers]);
  const teamBById = useMemo(() => new Map(teamBPlayers.map((p) => [p._id, p])), [teamBPlayers]);
  return { teamAById, teamBById };
}
