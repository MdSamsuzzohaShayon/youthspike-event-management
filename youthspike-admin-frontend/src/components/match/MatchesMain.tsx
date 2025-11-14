'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';

import Loader from '@/components/elements/Loader';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import MatchAdd from '@/components/match/MatchAdd';
import MatchList from '@/components/match/MatchList';

import { useUser } from '@/lib/UserProvider';
import { IEventExpRel, IGroupExpRel, IMatchExpRel, IOption, ITeam } from '@/types';
import { IUserContext, UserRole } from '@/types/user';
import { divisionsToOptionList } from '@/utils/helper';
import { removeTeamFromStore } from '@/utils/localStorage';

import { getUserFromCookie } from '@/utils/clientCookie';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';

interface MatchesMainProps {
  matches: IMatchExpRel[];
  teams: ITeam[];
  groups: IGroupExpRel[];
  currEvent: IEventExpRel;
}

interface FilteredData {
  teams: ITeam[];
  matches: IMatchExpRel[];
  groups: IGroupExpRel[];
}

/**
 * Returns the user's team based on their role
 */
function getUserTeam(user: IUserContext, teams: ITeam[]): ITeam | undefined {
  if (!user?.info) return undefined;

  const { role, captainplayer, cocaptainplayer, player } = user.info;
  if (!player) return undefined;

  switch (role) {
    case UserRole.captain:
      return teams.find((team) => team.captain?._id === captainplayer);
    case UserRole.co_captain:
      return teams.find((team) => team.cocaptain?._id === cocaptainplayer);
    case UserRole.player:
      return teams.find((team) => (team.players.map((p) => (typeof p === 'object' ? p._id : p)) as string[])?.includes(player));
    default:
      return undefined;
  }
}

/**
 * Returns matches that belong to the team of the current user
 */
function getUserScopedMatches(user: IUserContext, teams: ITeam[], matches: IMatchExpRel[]): IMatchExpRel[] {
  const userTeam = getUserTeam(user, teams);
  if (!userTeam) return matches;

  const userTeamId = userTeam._id;
  return matches.filter((match) => match?.teamA?._id === userTeamId || match?.teamB?._id === userTeamId);
}

/**
 * Check if user has restricted view (captain/co-captain/player)
 */
function hasRestrictedView(userRole?: UserRole): boolean {
  return [UserRole.captain, UserRole.co_captain, UserRole.player].includes(userRole as UserRole);
}

/**
 * Check if user can manage matches (admin/director)
 */
function canManageMatches(userRole?: UserRole): boolean {
  return userRole === UserRole.admin || userRole === UserRole.director;
}

function MatchesMain({ currEvent, matches, teams, groups }: MatchesMainProps) {
  if (!currEvent) {
    return <div>Event not found</div>;
  }

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [showMatchAddForm, setShowMatchAddForm] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState('');

  // Hooks
  const currentUser = useUser();
  const cachedUserFromCookie = useMemo(() => getUserFromCookie(), []);

  // Memoized values
  const divisionOptions: IOption[] = useMemo(() => divisionsToOptionList(currEvent?.divisions || ''), [currEvent?.divisions]);

  const userRole = currentUser?.info?.role;
  const hasRestrictedAccess = hasRestrictedView(userRole);
  const canManage = canManageMatches(userRole);

  // Apply division + user role filtering
  const filteredData: FilteredData = useMemo(() => {
    const normalizedDivision = selectedDivision.trim().toLowerCase();
    const hasDivisionFilter = Boolean(selectedDivision);

    // Filter by division
    let filteredTeams = hasDivisionFilter ? teams.filter((team) => team?.division?.trim().toLowerCase() === normalizedDivision) : teams;

    let filteredMatches = hasDivisionFilter ? matches.filter((match) => match?.division?.trim().toLowerCase() === normalizedDivision) : matches;

    let filteredGroups = hasDivisionFilter ? groups.filter((group) => group?.division?.trim().toLowerCase() === normalizedDivision) : groups;

    // Apply user scope filtering for restricted roles
    if (cachedUserFromCookie?.info && hasRestrictedView(cachedUserFromCookie.info.role)) {
      filteredMatches = getUserScopedMatches(cachedUserFromCookie, filteredTeams, filteredMatches);
    }

    return {
      teams: filteredTeams,
      matches: filteredMatches,
      groups: filteredGroups,
    };
  }, [selectedDivision, cachedUserFromCookie, teams, matches, groups]);

  const { teams: divisionTeams, matches: divisionMatches, groups: divisionGroups } = filteredData;

  // Initialize division filter from localStorage
  useEffect(() => {
    removeTeamFromStore();
    const savedDivision = SessionStorageService.getItem(DIVISION);
    if (savedDivision) {
      setSelectedDivision(String(savedDivision).trim());
    }
  }, []);

  // Division dropdown handler
  const handleDivisionChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const selectedValue = inputEl.value.trim();
    setSelectedDivision(selectedValue);

    if (selectedValue) {
      SessionStorageService.setItem(DIVISION, selectedValue);
    } else {
      SessionStorageService.removeItem(DIVISION);
    }
  }, []);

  // Callback when a new match is added
  const handleMatchAdded = useCallback(
    (newMatch: IMatchExpRel) => {
      // Note: This mutates the original matches array
      // Consider using state management if this causes issues
      matches.push(newMatch);
    },
    [matches],
  );

  // Toggle between add form and list view
  const toggleMatchView = useCallback(() => {
    setShowMatchAddForm((prev) => !prev);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      {/* Event Header + Menu */}
      <div className="event-and-menu">
        <CurrentEvent currEvent={currEvent} />
        <div className="navigator mt-4">
          <UserMenuList eventId={currEvent?._id} />
        </div>
      </div>

      <div className="mt-4">
        {showMatchAddForm ? (
          <div className="match-add-wrapper w-full">
            {canManage && (
              <>
                <button type="button" className="btn-info mb-4" onClick={toggleMatchView}>
                  Match List
                </button>

                {!hasRestrictedAccess && (
                  <div className="division-selection w-full">
                    <SelectInput key="division-selector-add" handleSelect={handleDivisionChange} defaultValue={selectedDivision} name="division" optionList={divisionOptions} />
                  </div>
                )}

                <MatchAdd
                  eventData={currEvent}
                  teamList={divisionTeams}
                  eventId={currEvent?._id}
                  addMatchCB={handleMatchAdded}
                  setIsLoading={setIsLoading}
                  showAddMatch={setShowMatchAddForm}
                  groupList={divisionGroups}
                  currDivision={selectedDivision}
                />
              </>
            )}
          </div>
        ) : (
          <div className="match-list-wrapper w-full">
            {canManage && (
              <button type="button" className="btn-info mb-4" onClick={toggleMatchView}>
                Add Match
              </button>
            )}

            <br />

            {!hasRestrictedAccess && (
              <div className="division-selection w-full">
                <SelectInput key="division-selector-list" handleSelect={handleDivisionChange} defaultValue={selectedDivision} name="division" optionList={divisionOptions} />
              </div>
            )}

            {divisionMatches.length > 0 ? (
              <MatchList
                eventId={currEvent?._id}
                setIsLoading={setIsLoading}
                matchList={divisionMatches}
                teamList={teams}
                refetchFunc={() => window.location.reload()}
                groupList={divisionGroups}
              />
            ) : (
              <p>No matches created yet!</p>
            )}
          </div>
        )}
      </div>
      <br />
    </>
  );
}

export default MatchesMain;
