import {
  EPlayerStatus,
  IEvent,
  IPlayer,
  IPlayerRankingExpRel,
  ITeam,
  UserRole,
} from '@/types';
import { useMemo } from 'react';
import PlayerList from '../player/PlayerList';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';

interface PlayerWithRank extends IPlayer {
  rank?: number;
}

interface RosterWrapperProps {
  events: IEvent[];
  team: ITeam;
  players: IPlayer[];
  playerRanking: IPlayerRankingExpRel | null;
}

function RosterWrapper({
  events,
  players,
  team,
  playerRanking,
}: RosterWrapperProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  /**
   * ✅ Single computation
   * - O(n) pass
   * - O(n log n) only for active sorting
   */
  const { activePlayers, inactivePlayers } = useMemo(() => {
    const active: PlayerWithRank[] = [];
    const inactive: IPlayer[] = [];

    // Build ranking lookup only once
    const rankingMap = new Map<string, number>();
    if (playerRanking?.rankings?.length) {
      for (let i = 0; i < playerRanking.rankings.length; i++) {
        const r = playerRanking.rankings[i];
        rankingMap.set(String(r.player), r.rank);
      }
    }

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      if (player.status === EPlayerStatus.INACTIVE) {
        inactive.push(player);
        continue;
      }

      // ACTIVE player
      active.push({
        ...player,
        rank: rankingMap.get(player._id),
      });
    }

    // Sort active players by rank (undefined goes last)
    active.sort((a, b) => {
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    });

    return { activePlayers: active, inactivePlayers: inactive };
  }, [players, playerRanking]);


  const canRank = useMemo(()=>{
    // Only captain of the team, director, and admin can change rank
    if(!user || !user.token || !user.info || user.info.role === UserRole.public || user.info.role === UserRole.player) return false;
    // Check if the role is captain or co-captain is he captain of the current team
    if(user.info.role === UserRole.captain){
      if(user.info.captainplayer !== team.captain) return false;
    }
    if(user.info.role === UserRole.co_captain){
      if(user.info.cocaptainplayer !== team.cocaptain) return false;
    }
    return true;
  }, [user, team]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Team Roster</h2>
          <p className="text-xs text-gray-400">{`${activePlayers.length} active players`}</p>
        </div>
        {canRank && (
          <div className="py-3 px-3 text-center">
            <Link
              href={`${ADMIN_FRONTEND_URL}/teams/${team._id}/roster/${ldoIdUrl}`}
              className="btn-info"
            >
              Change ranking
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <PlayerList players={activePlayers} events={events} />
      </div>

      {inactivePlayers.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400">
              Inactive Players
            </h3>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
              {inactivePlayers.length}
            </span>
          </div>

          <PlayerList players={inactivePlayers} events={events} />
        </div>
      )}
    </div>
  );
}



export default RosterWrapper;