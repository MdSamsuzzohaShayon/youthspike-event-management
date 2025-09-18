'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
 * Filters matches for a user based on role (captain, co-captain, player)
 */
function filterMatchesForUser(user: IUserContext, teams: ITeam[], matches: IMatchExpRel[]): IMatchExpRel[] {
  if (!user?.info) return matches;

  let findTeam: ITeam | undefined;

  switch (user.info.role) {
    case UserRole.captain:
      findTeam = teams.find((t) => t.captain?._id === user.info?.captainplayer);
      break;
    case UserRole.co_captain:
      findTeam = teams.find((t) => t.cocaptain?._id === user.info?.cocaptainplayer);
      break;
    case UserRole.player:
      // @ts-ignore
      findTeam = teams.find((t) => t.players?.includes(user.info?.player));
      break;
    default:
      break;
  }

  if (!findTeam) return matches;

  return matches.filter((m) => {
    const teamAId = m?.teamA?._id;
    const teamBId = m?.teamB?._id;
    const findTeamId = findTeam?._id;

    return teamAId === findTeamId || teamBId === findTeamId;
  });
}

function MatchesMain({ currEvent, matches, teams, groups }: IMatchesMainProps) {

  if (!currEvent) {
    return <div>Event not found</div>;
  }

  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addMatch, setAddMatch] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');

  // Hooks
  const user = useUser();
  const localUser = useMemo(() => getUserFromCookie(), []);

  // Memoized division list (static per event)
  const divisionList: IOption[] = useMemo(() => divisionsToOptionList(currEvent?.divisions || ''), [currEvent?.divisions]);

  // Memoized filtered data
  const { filteredTeams, filteredMatches, filteredGroups } = useMemo(() => {
    let filteredTeams = teams || [];
    let filteredMatches = matches || [];
    let filteredGroups = groups || [];

    // Apply division filter if selected
    if (currDivision) {
      const division = currDivision.trim().toLowerCase();
      filteredTeams = filteredTeams.filter((t) => t?.division?.trim().toLowerCase() === division);
      filteredMatches = filteredMatches.filter((m) => m?.division?.trim().toLowerCase() === division);
      filteredGroups = filteredGroups.filter((g) => g?.division?.trim().toLowerCase() === division);
    }

    // Apply user filtering
    if (localUser?.info?.role && [UserRole.captain, UserRole.co_captain, UserRole.player].includes(localUser.info.role)) {
      filteredMatches = filterMatchesForUser(localUser, filteredTeams, filteredMatches);
    }

    return { filteredTeams, filteredMatches, filteredGroups };
  }, [currDivision, localUser, teams, matches, groups]);

  const refetchFunc = async () =>
    // Effect: Load division from store on mount
    useEffect(() => {
      removeTeamFromStore();
      const divisionExist = getDivisionFromStore();
      if (divisionExist) setCurrDivision(divisionExist);
    }, []);

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    const selectedValue = inputEl.value.trim();
    setCurrDivision(selectedValue);

    if (selectedValue === '') {
      removeDivisionFromStore();
    } else {
      setDivisionToStore(selectedValue);
    }
  };

  const addMatchCB = (matchData: IMatchExpRel) => {
    // Directly append to filteredMatches for instant UI update
    // Avoids extra re-fetch
    // This works because we compute filtered list based on division
    // and we already know matchData belongs to current division
    matches.push(matchData);
  };

  if (isLoading) return <Loader />;

  return (
    <>
      {/* Event Menu Start */}
      <div className="event-and-menu">
        {currEvent && (
          <>
            <CurrentEvent currEvent={currEvent} />
            <div className="navigator mt-4">
              <UserMenuList eventId={currEvent?._id} />
            </div>
          </>
        )}
      </div>
      {/* Event Menu End */}

      <div className="mt-4">
        {addMatch ? (
          <div className="match-add-wrapper w-full">
            {user?.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
              <>
                <button type="button" className="btn-info mb-4" onClick={() => setAddMatch(false)}>
                  Match List
                </button>

                {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) && (
                  <div className="division-selection w-full">
                    <SelectInput key="matches-si-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} />
                  </div>
                )}

                <MatchAdd
                  eventData={currEvent}
                  teamList={filteredTeams}
                  eventId={currEvent?._id}
                  addMatchCB={addMatchCB}
                  setIsLoading={setIsLoading}
                  showAddMatch={setAddMatch}
                  groupList={filteredGroups}
                  currDivision={currDivision}
                />
              </>
            )}
          </div>
        ) : (
          <div className="match-list-wrapper w-full">
            {user?.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
              <button type="button" className="btn-info mb-4" onClick={() => setAddMatch(true)}>
                Add Match
              </button>
            )}
            <br />
            {(user?.info?.role === undefined || ![UserRole.captain, UserRole.co_captain, UserRole.player].includes(user.info.role)) && (
              <div className="division-selection w-full">
                <SelectInput key="matches-si-2" handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} />
              </div>
            )}
            {filteredMatches.length > 0 ? (
              <MatchList eventId={currEvent?._id} setIsLoading={setIsLoading} matchList={filteredMatches} teamList={teams} refetchFunc={refetchFunc} groupList={filteredGroups} />
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
