'use client';

import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import { divisionsToOptionList } from '@/utils/helper';
import { IEvent, IGroupRelatives, IPlayerRankingExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { removeTeamFromStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import PlayerList from '@/components/player/PlayerList';
import UserMenuList from '@/components/layout/UserMenuList';
import Pagination from '../elements/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import InputField from '../elements/forms/InputField';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';

interface IPlayersMainProps {
  currEvent: IEvent;
  players: IPlayerExpRel[];
  groups: IGroupRelatives[];
  teams: ITeam[];
  playerRanking: IPlayerRankingExpRel | null;
}

interface IFilter {
  division: string;
  search: string;
}

const ITEMS_PER_PAGE = 30;

function PlayersMain({ currEvent, players, groups, teams, playerRanking }: IPlayersMainProps) {
  const user = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial state from query params
  const initialDivision = searchParams.get('division') || '';
  const initialSearch = searchParams.get('search') || '';
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

  const [filter, setFilter] = useState<IFilter>({
    division: initialDivision,
    search: initialSearch,
  });

  const [teamId, setTeamId] = useState<string | null>(null);

  // Function to update query params
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
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
    },
    [searchParams, router, pathname],
  );

  // Update URL when state changes
  useEffect(() => {
    updateQueryParams({
      division: filter.division || null,
      search: filter.search || null,
      pageActive: currentPageActive.toString(),
      pageInactive: currentPageInactive.toString(),
      addPlayer: addPlayer ? 'true' : null,
    });
  }, [filter.division, filter.search, currentPageActive, currentPageInactive, addPlayer, updateQueryParams]);

  // Handle division change
  const handleDivisionChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    const value = inputEl.value.trim();
    setFilter((prev) => ({ ...prev, division: value }));

    // Reset pagination when division changes
    setCurrentPageActive(1);
    setCurrentPageInactive(1);

    if (!value) SessionStorageService.removeItem(DIVISION);
    else SessionStorageService.setItem(DIVISION, value);
  }, []);

  // Handle search change - remove debounce for immediate feedback
  const handleSearchChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const value = inputEl.value;
    setFilter((prev) => ({ ...prev, search: value }));

    // Reset pagination when search changes
    setCurrentPageActive(1);
    setCurrentPageInactive(1);
  }, []);

  const handleAddPlayerToggle = () => {
    setAddPlayer((prev) => !prev);
  };

  const refetchFunc = async () => window.location.reload();

  // Load division from store initially (fallback for backward compatibility)
  useEffect(() => {
    removeTeamFromStore();
    const divisionExist = SessionStorageService.getItem(DIVISION);
    if (divisionExist && !filter.division) {
      setFilter((prev) => ({ ...prev, division: divisionExist as string }));
    }
  }, [filter.division]);

  /** ------------------------------
   * FILTERING & SCOPING
   * ------------------------------ */
  const { filteredPlayers, filteredTeams } = useMemo(() => {
    let basePlayers = players;
    let baseTeams = teams;

    // Captain / Co-captain scope → only their team players
    if (user?.info?.role && [UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) {
      const pId = user.info?.captainplayer || user.info?.cocaptainplayer || user.info?.player;
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
    if (filter.division) {
      const div = filter.division.trim().toLowerCase();
      basePlayers = basePlayers.filter((p) => p.division?.trim().toLowerCase() === div);
      baseTeams = baseTeams.filter((t) => t.division?.trim().toLowerCase() === div);
    }

    // Search filter - use immediate value (not debounced)
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase().trim();

      // Split by spaces for multi-word search
      const searchParts = searchTerm.split(/\s+/);

      basePlayers = basePlayers.filter((p) => {
        const first = (p.firstName || '').toLowerCase();
        const last = (p.lastName || '').toLowerCase();
        const username = (p.username || '').toLowerCase();

        const fullName = `${first} ${last}`.trim();

        // 1️⃣ Single-word search (normal behavior)
        const basicMatch = first.includes(searchTerm) || last.includes(searchTerm) || username.includes(searchTerm) || fullName.includes(searchTerm);

        // 2️⃣ Multi-word search (“john doe” must match both)
        const multiWordMatch = searchParts.every((part) => fullName.includes(part));

        return basicMatch || multiWordMatch;
      });
    }

    return { filteredPlayers: basePlayers, filteredTeams: baseTeams };
  }, [players, teams, user, filter.division, filter.search]); // Use filter.search directly

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

  const divisionList = useMemo(() => (currEvent?.divisions ? divisionsToOptionList(currEvent.divisions) : []), [currEvent]);

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
              <SelectInput key="players-pg-1" handleSelect={handleDivisionChange} value={filter.division} name="division" optionList={divisionList} />
            </div>
          )}

          <PlayerAdd eventId={currEvent._id} setAddPlayer={setAddPlayer} teamList={filteredTeams} division={filter.division} />
        </>
      ) : (
        <>
          <div className="bg-gray-800 p-2 rounded-xl mt-6 ">
            {/* Player List Mode */}
            <div className="w-full flex justify-between items-center rounded-lg">
              <h3>Player List</h3>
              {(user?.info?.role === UserRole.admin || user?.info?.role === UserRole.director) && (
                <button className="btn-info" onClick={handleAddPlayerToggle}>
                  Add player
                </button>
              )}
            </div>
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) && (
                <SelectInput key="players-pg-2" handleSelect={handleDivisionChange} value={filter.division} name="division" label="division" optionList={divisionList} />
              )}
              <InputField name="search" type="text" value={filter.search} placeholder="Search by name..." handleInputChange={handleSearchChange} />
            </div>
          </div>

          <div className="player-list mt-6">
            <PlayerList
              key={`active-page-${currentPageActive}-search-${filter.search}`}
              playerList={paginatedActivePlayers}
              eventId={currEvent._id}
              setIsLoading={setIsLoading}
              rankControls={rankControls && !lockRank}
              refetchFunc={refetchFunc}
              teamList={filteredTeams}
              divisionList={divisionList}
              showRank={showRank}
              playerRanking={playerRanking}
              teamId={teamId}
              currEvent={currEvent}
            />

            {/* Active Players Pagination */}
            {activePlayers.length > 0 && <Pagination currentPage={currentPageActive} itemList={activePlayers} setCurrentPage={setCurrentPageActive} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />}
          </div>

          {inactivePlayers.length > 0 && (
            <>
              <PlayerList
                key={`inactive-page-${currentPageInactive}-search-${filter.search}`}
                inactive
                currEvent={currEvent}
                eventId={currEvent._id}
                playerList={paginatedInactivePlayers}
                setIsLoading={setIsLoading}
                refetchFunc={refetchFunc}
                teamList={filteredTeams}
                divisionList={divisionList}
              />

              {/* Inactive Players Pagination */}
              <Pagination currentPage={currentPageInactive} itemList={inactivePlayers} setCurrentPage={setCurrentPageInactive} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
            </>
          )}

          {filteredPlayers.length === 0 && <p className="text-center text-gray-400 mt-6">{filter.search || filter.division ? 'No players match your filters.' : 'No players available.'}</p>}
        </>
      )}
    </>
  );
}

export default PlayersMain;
