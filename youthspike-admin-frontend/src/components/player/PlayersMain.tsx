'use client';

import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IEvent, IGroupRelatives, IPlayerRankingExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getDivisionFromStore, getPlayerPage, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore, setPlayerPage } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import PlayerList from '@/components/player/PlayerList';
import UserMenuList from '@/components/layout/UserMenuList';
import Pagination from '../elements/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface IPlayersMainProps {
  currEvent: IEvent;
  players: IPlayerExpRel[];
  groups: IGroupRelatives[];
  teams: ITeam[];
  playerRanking: IPlayerRankingExpRel | null;
}

const ITEMS_PER_PAGE = 10;

function PlayersMain({ currEvent, players, groups, teams, playerRanking }: IPlayersMainProps) {
  const user = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial state from query params
  const initialDivision = searchParams.get('division') || '';
  const initialPageActive = parseInt(searchParams.get('pageActive') || '1');
  const initialPageInactive = parseInt(searchParams.get('pageInactive') || '1');
  const initialAddPlayer = searchParams.get('addPlayer') === 'true';

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState(initialAddPlayer);
  const [showRank, setShowRank] = useState<boolean>(false);
  const [rankControls, setRankControls] = useState<boolean>(false);
  const [lockRank, setLockRank] = useState<boolean>(false);

  const [currentPageActive, setCurrentPageActive] = useState(initialPageActive);
  const [currentPageInactive, setCurrentPageInactive] = useState(initialPageInactive);

  const [currDivision, setCurrDivision] = useState(initialDivision);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Function to update query params
  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Replace instead of push to avoid cluttering history
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Update URL when state changes
  useEffect(() => {
    updateQueryParams({
      division: currDivision || null,
      pageActive: currentPageActive.toString(),
      pageInactive: currentPageInactive.toString(),
      addPlayer: addPlayer ? 'true' : null,
    });
  }, [currDivision, currentPageActive, currentPageInactive, addPlayer, updateQueryParams]);

  // Handle division change
  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    const value = (e.target as HTMLInputElement).value.trim();
    setCurrDivision(value);
    // Reset pagination when division changes
    setCurrentPageActive(1);
    setCurrentPageInactive(1);

    if (!value) removeDivisionFromStore();
    else setDivisionToStore(value);
  };

  const handleAddPlayerToggle = () => {
    setAddPlayer(prev => !prev);
  };

  console.log(user);
  

  const refetchFunc = async () => window.location.reload();

  // Load division from store initially (fallback for backward compatibility)
  useEffect(() => {
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist && !currDivision) {
      setCurrDivision(divisionExist);
    }
  }, [currDivision]);

  /** ------------------------------
   * FILTERING & SCOPING
   * ------------------------------ */
  const { filteredPlayers, filteredTeams } = useMemo(() => {
    let basePlayers = players;
    let baseTeams = teams;

    // Captain / Co-captain scope → only their team players
    if (user?.info?.role && [UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) {
      const pId = user.info?.captainplayer || user.info?.cocaptainplayer || user.info?.player;; 
      const playerExist = players.find((p) => p._id === pId);

      if (playerExist?.teams?.[0]) {
        const tId = playerExist.teams[0]._id;
        const teamExist = teams.find((t) => t._id === tId);

        if (teamExist) {
          setShowRank(true);
          setRankControls(true);
          setTeamId(tId);

          basePlayers = players.filter((p) => p.teams?.some((t) => t._id === tId));
          baseTeams = teams.filter((t) => t._id === tId);
        }
      }
    }

    // Division filter
    if (currDivision) {
      const div = currDivision.trim().toLowerCase();
      basePlayers = basePlayers.filter((p) => p.division?.trim().toLowerCase() === div);
      baseTeams = baseTeams.filter((t) => t.division?.trim().toLowerCase() === div);
    }

    return { filteredPlayers: basePlayers, filteredTeams: baseTeams };
  }, [players, teams, user, currDivision]);

  /** ------------------------------
   * ACTIVE + INACTIVE SPLIT
   * ------------------------------ */
  const activePlayers = useMemo(() => filteredPlayers.filter((p) => p.status === EPlayerStatus.ACTIVE), [filteredPlayers]);

  const inactivePlayers = useMemo(() => filteredPlayers.filter((p) => p.status === EPlayerStatus.INACTIVE), [filteredPlayers]);

  /** ------------------------------
   * PAGINATION
   * ------------------------------ */
  const paginatedActivePlayers = useMemo(() => {
    const start = (currentPageActive - 1) * ITEMS_PER_PAGE;
    return activePlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [activePlayers, currentPageActive]);

  const paginatedInactivePlayers = useMemo(() => {
    const start = (currentPageInactive - 1) * ITEMS_PER_PAGE;
    return inactivePlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [inactivePlayers, currentPageInactive]);

  const divisions = useMemo(() => (currEvent?.divisions ? divisionsToOptionList(currEvent.divisions) : []), [currEvent]);

  if (isLoading) return <Loader />;

  return (
    <>
      {/* Event Header */}
      <div className="event-and-menu">
        {currEvent && <CurrentEvent currEvent={currEvent} />}
        <div className="team-name text-center">{user?.info?.team && <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>}</div>
        <div className="navigator mt-8">
          <UserMenuList eventId={currEvent._id} />
        </div>
      </div>

      {/* Player Add Mode */}
      {addPlayer ? (
        <>
          <div className="w-full bg-gray-800 flex justify-between items-center p-4 mt-6 rounded-lg">
            <h3>Player Add</h3>
            <button className="btn-info" onClick={handleAddPlayerToggle}>
              Player List
            </button>
          </div>

          {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) && (
            <div className="mb-4 division-selection w-full mt-6">
              <SelectInput key="players-pg-1" handleSelect={handleDivisionSelection} value={currDivision} name="division" optionList={divisions} />
            </div>
          )}

          <PlayerAdd eventId={currEvent._id} setAddPlayer={setAddPlayer} teamList={filteredTeams} division={currDivision} />
        </>
      ) : (
        <>
          {/* Player List Mode */}
          <div className="w-full bg-gray-800 flex justify-between items-center p-4 mt-6 rounded-lg">
            <h3>Player List</h3>
            {(user?.info?.role === UserRole.admin || user?.info?.role === UserRole.director) && (
              <button className="btn-info" onClick={handleAddPlayerToggle}>
                Add player
              </button>
            )}
          </div>

          {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) && (
            <div className="mb-4 division-selection w-full mt-6">
              <SelectInput key="players-pg-2" handleSelect={handleDivisionSelection} value={currDivision} name="division" optionList={divisions} />
            </div>
          )}

          <div className="player-list mt-6">
            <PlayerList
              key={`active-page-${currentPageActive}`}
              playerList={paginatedActivePlayers}
              eventId={currEvent._id}
              setIsLoading={setIsLoading}
              rankControls={rankControls && !lockRank}
              refetchFunc={refetchFunc}
              teamList={filteredTeams}
              divisionList={divisions}
              showRank={showRank}
              playerRanking={playerRanking}
              teamId={teamId}
              currEvent={currEvent}
            />

            {/* Active Players Pagination */}
            <Pagination currentPage={currentPageActive} itemList={activePlayers} setCurrentPage={setCurrentPageActive} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
          </div>

          <PlayerList
            key={`inactive-page-${currentPageInactive}`}
            inactive
            currEvent={currEvent}
            eventId={currEvent._id}
            playerList={paginatedInactivePlayers}
            setIsLoading={setIsLoading}
            refetchFunc={refetchFunc}
            teamList={filteredTeams}
            divisionList={divisions}
          />

          {/* Inactive Players Pagination */}
          <Pagination currentPage={currentPageInactive} itemList={inactivePlayers} setCurrentPage={setCurrentPageInactive} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
        </>
      )}
    </>
  );
}

export default PlayersMain;