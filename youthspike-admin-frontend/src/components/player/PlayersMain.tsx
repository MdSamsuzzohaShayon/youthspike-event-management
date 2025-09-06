'use client';

import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import React, { useState, useEffect, useMemo } from 'react';
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

  const [isLoading, setIsLoading] = useState(false);
  const [addPlayer, setAddPlayer] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [rankControls, setRankControls] = useState(false);
  const [lockRank, setLockRank] = useState(false);

  const [currentPageActive, setCurrentPageActive] = useState(1);
  const [currentPageInactive, setCurrentPageInactive] = useState(1);

  const [currDivision, setCurrDivision] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);

  // Handle division change
  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    const value = (e.target as HTMLInputElement).value.trim();
    setCurrDivision(value);

    if (!value) removeDivisionFromStore();
    else setDivisionToStore(value);
  };

  const refetchFunc = async () => window.location.reload();

  // ✅ Load pagination state from localStorage when mounting
  useEffect(() => {
    const activePage = getPlayerPage(`${currEvent._id}-active`);
    const inactivePage = getPlayerPage(`${currEvent._id}-inactive`);

    if (activePage?.page) setCurrentPageActive(activePage.page);
    if (inactivePage?.page) setCurrentPageInactive(inactivePage.page);
  }, [currEvent._id]);

  // ✅ Save pagination state to localStorage when it changes
  useEffect(() => {
    setPlayerPage(`${currEvent._id}-active`, currentPageActive);
  }, [currEvent._id, currentPageActive]);

  useEffect(() => {
    setPlayerPage(`${currEvent._id}-inactive`, currentPageInactive);
  }, [currEvent._id, currentPageInactive]);

  // Load division from store initially
  useEffect(() => {
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) setCurrDivision(divisionExist);
  }, []);

  /** ------------------------------
   * FILTERING & SCOPING
   * ------------------------------ */
  const { filteredPlayers, filteredTeams } = useMemo(() => {
    let basePlayers = players;
    let baseTeams = teams;

    // Captain / Co-captain scope → only their team players
    if (user?.info?.role && [UserRole.captain, UserRole.co_captain].includes(user.info.role)) {
      const pId = user.info?.captainplayer || user.info?.cocaptainplayer;
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
            <button className="btn-info" onClick={() => setAddPlayer(false)}>
              Player List
            </button>
          </div>

          {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain].includes(user.info.role)) && (
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
              <button className="btn-info" onClick={() => setAddPlayer(true)}>
                Add player
              </button>
            )}
          </div>

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
