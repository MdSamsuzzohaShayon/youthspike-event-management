import { useCallback } from 'react';
import { IServerTeam, IReceiverTeam, INetRelatives } from '@/types';
import { IPlayer } from '@/types';

type TeamReturn = IServerTeam | IReceiverTeam | null;

/** Generic helper reused for both server & receiver */
export default function useMakeTeam(
  netByNum: Map<number, INetRelatives>,
  teamAById: Map<string, IPlayer>,
  teamBById: Map<string, IPlayer>,
) {
  return useCallback(
    (
      playerId: string | null | undefined,
      currNetNum: number | null,
      isServer: boolean,
    ): TeamReturn => {
      if (!playerId || !currNetNum) return null;
      const net = netByNum.get(currNetNum);
      if (!net) return null;

      const build = (
        primary: string | null | undefined,
        partner: string | null | undefined,
        map: Map<string, IPlayer>,
      ) =>
        isServer
          ? {
              server: map.get(primary ?? '') ?? null,
              servingPartner: map.get(partner ?? '') ?? null,
            }
          : {
              receiver: map.get(primary ?? '') ?? null,
              receivingPartner: map.get(partner ?? '') ?? null,
            };

      /* A-side */
      if (teamAById.has(playerId)) {
        if (playerId === net.teamAPlayerA) return build(net.teamAPlayerA, net.teamAPlayerB, teamAById);
        if (playerId === net.teamAPlayerB) return build(net.teamAPlayerB, net.teamAPlayerA, teamAById);
      }

      /* B-side */
      if (teamBById.has(playerId)) {
        if (playerId === net.teamBPlayerA) return build(net.teamBPlayerA, net.teamBPlayerB, teamBById);
        if (playerId === net.teamBPlayerB) return build(net.teamBPlayerB, net.teamBPlayerA, teamBById);
      }
      return null;
    },
    [netByNum, teamAById, teamBById],
  );
}
