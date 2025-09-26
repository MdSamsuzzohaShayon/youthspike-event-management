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
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';

import { getUserFromCookie } from '@/utils/clientCookie';

interface IMatchesMainProps {
  matches: IMatchExpRel[];
  teams: ITeam[];
  groups: IGroupExpRel[];
  currEvent: IEventExpRel;
}

/**
 * Returns matches that belong to the team of the current user (if captain/co-captain/player).
 */
function getUserScopedMatches(user: IUserContext, teams: ITeam[], matches: IMatchExpRel[]): IMatchExpRel[] {
  if (!user?.info) return matches;

  let userTeam: ITeam | undefined;

  switch (user.info.role) {
    case UserRole.captain:
      userTeam = teams.find((t) => t.captain?._id === user.info?.captainplayer);
      break;
    case UserRole.co_captain:
      userTeam = teams.find((t) => t.cocaptain?._id === user.info?.cocaptainplayer);
      break;
    case UserRole.player:
      // @ts-ignore
      userTeam = teams.find((t) => t.players?.includes(user.info?.player));
      break;
    default:
      break;
  }

  if (!userTeam) return matches;

  const teamId = userTeam._id;
  return matches.filter((m) => m?.teamA?._id === teamId || m?.teamB?._id === teamId);
}

function MatchesMain({ currEvent, matches, teams, groups }: IMatchesMainProps) {
  if (!currEvent) return <div>Event not found</div>;

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [showMatchAddForm, setShowMatchAddForm] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState('');

  // Hooks
  const currentUser = useUser();
  const cachedUserFromCookie = useMemo(() => getUserFromCookie(), []);

  // Division list (memoized, only changes when event divisions change)
  const divisionOptions: IOption[] = useMemo(() => divisionsToOptionList(currEvent?.divisions || ''), [currEvent?.divisions]);

  // Apply division + user role filtering in one memoized block
  const { divisionTeams, divisionMatches, divisionGroups } = useMemo(() => {
    let divisionTeams = teams;
    let divisionMatches = matches;
    let divisionGroups = groups;

    if (selectedDivision) {
      const divisionKey = selectedDivision.trim().toLowerCase();
      divisionTeams = divisionTeams.filter((t) => t?.division?.trim().toLowerCase() === divisionKey);
      divisionMatches = divisionMatches.filter((m) => m?.division?.trim().toLowerCase() === divisionKey);
      divisionGroups = divisionGroups.filter((g) => g?.division?.trim().toLowerCase() === divisionKey);
    }

    if (cachedUserFromCookie?.info?.role && [UserRole.captain, UserRole.co_captain, UserRole.player].includes(cachedUserFromCookie.info.role)) {
      divisionMatches = getUserScopedMatches(cachedUserFromCookie, divisionTeams, divisionMatches);
    }

    return { divisionTeams, divisionMatches, divisionGroups };
  }, [selectedDivision, cachedUserFromCookie, teams, matches, groups]);

  // Refetch function (reload page)
  const refetchMatches = useCallback(() => {
    window.location.reload();
  }, []);

  // On mount: initialize division filter from localStorage
  useEffect(() => {
    removeTeamFromStore();
    const storedDivision = getDivisionFromStore();
    if (storedDivision) setSelectedDivision(storedDivision);
  }, []);

  // Division dropdown handler
  const handleDivisionChange = useCallback((e: React.SyntheticEvent) => {
    const selectedValue = (e.target as HTMLSelectElement).value.trim();
    setSelectedDivision(selectedValue);

    if (selectedValue) {
      setDivisionToStore(selectedValue);
    } else {
      removeDivisionFromStore();
    }
  }, []);

  // Callback when a new match is added
  const handleMatchAdded = useCallback(
    (newMatch: IMatchExpRel) => {
      // Mutating matches directly — keeps UI fast and avoids unnecessary refetch
      matches.push(newMatch);
    },
    [matches],
  );

  if (isLoading) return <Loader />;

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
            {currentUser?.info && (currentUser.info.role === UserRole.admin || currentUser.info.role === UserRole.director) && (
              <>
                <button type="button" className="btn-info mb-4" onClick={() => setShowMatchAddForm(false)}>
                  Match List
                </button>

                {/* Only allow division selection if user is not a captain/co-captain/player */}
                {!currentUser?.info?.role || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(currentUser.info.role) ? (
                  <div className="division-selection w-full">
                    <SelectInput key="division-selector-add" handleSelect={handleDivisionChange} defaultValue={selectedDivision} name="division" optionList={divisionOptions} />
                  </div>
                ) : null}

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
            {currentUser?.info && (currentUser.info.role === UserRole.admin || currentUser.info.role === UserRole.director) && (
              <button type="button" className="btn-info mb-4" onClick={() => setShowMatchAddForm(true)}>
                Add Match
              </button>
            )}
            <br />

            {/* Only allow division selection if user is not a captain/co-captain/player */}
            {!currentUser?.info?.role || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(currentUser.info.role) ? (
              <div className="division-selection w-full">
                <SelectInput key="division-selector-list" handleSelect={handleDivisionChange} defaultValue={selectedDivision} name="division" optionList={divisionOptions} />
              </div>
            ) : null}

            {divisionMatches.length > 0 ? (
              <MatchList eventId={currEvent?._id} setIsLoading={setIsLoading} matchList={divisionMatches} teamList={teams} refetchFunc={refetchMatches} groupList={divisionGroups} />
            ) : (
              <p>No match created yet!</p>
            )}
          </div>
        )}
      </div>
      <br />
    </>
  );
}

export default MatchesMain;
