'use client';

// React.js and Next.js
import React, { useEffect, useMemo, useState } from 'react';

// Components
import Loader from '@/components/elements/Loader';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import MatchAdd from '@/components/match/MatchAdd';
import MatchList from '@/components/match/MatchList';

// GraphQL, helpers, utils, types
import { useUser } from '@/lib/UserProvider';
import { IEventExpRel, IGroupExpRel, IGroupRelatives, IMatchExpRel, IOption, ITeam } from '@/types';
import { IUserContext, UserRole } from '@/types/user';
import { divisionsToOptionList } from '@/utils/helper';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';

import Pagination from '@/components/elements/Pagination';
import { getUserFromCookie } from '@/utils/clientCookie';



interface IMatchesMainProps{
  matches: IMatchExpRel[];
  teams: ITeam[];
  groups: IGroupExpRel[];
  currEvent: IEventExpRel;
}

const ITEMS_PER_PAGE = 30;
function MatchesMain({currEvent, matches, teams, groups}: IMatchesMainProps) {
  

  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addMatch, setAddMatch] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
  const [filteredGroupList, setFilteredGroupList] = useState<IGroupExpRel[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  

  // Hooks
  const user = useUser();

  // Fetch teams and players of the teams
  const captainsMatches = (localUser: IUserContext, prevFilteredTeams: ITeam[], prevFilteredMatches: IMatchExpRel[]): IMatchExpRel[] => {
    let filteredMatches = [...prevFilteredMatches];
    let findTeam: ITeam | null = null;
    if (localUser.info?.role === UserRole.captain) {
      findTeam = prevFilteredTeams.find((team) => team.captain?._id === localUser.info?.captainplayer) ?? null;
    }
    if (localUser.info?.role === UserRole.co_captain) {
      findTeam = prevFilteredTeams.find((team) => team.cocaptain?._id === localUser.info?.cocaptainplayer) ?? null;
    }
    if (findTeam) {
      filteredMatches = prevFilteredMatches.filter((m) => findTeam && (m.teamA._id === findTeam._id || m.teamB._id === findTeam._id));
    }
    return filteredMatches;
  };

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    /**
     * Filter Matches and teams
     */
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    // If logged in as captain check me I the captain of one of the team or not
    const localUser = getUserFromCookie();
    let newTeamList = [...teams];
    let newMatchList = [...matches];
    let newGroupList = [...groups];
    if (localUser.info?.role === UserRole.captain || localUser.info?.role === UserRole.co_captain) {
      newMatchList = captainsMatches(localUser, newTeamList, newMatchList);
    }

    if (inputEl.value === '') {
      setFilteredTeamList([...teams]);
      setFilteredMatchList([...newMatchList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      newTeamList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredTeamList([...newTeamList]);

      newMatchList = newMatchList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredMatchList([...newMatchList]);

      newGroupList = newGroupList.filter((g) => g.division && g.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredGroupList(newGroupList);
    }
  };



  const refetchFunc = async () => {
    // await fetchEvent();
  };

  const addMatchCB = (matchData: IMatchExpRel) => {
    // setMatchList((prevState) => [...prevState, matchData]);
    setFilteredMatchList((prevState) => [...prevState, matchData]);
    // refetchFunc();
  };


  useEffect(() => {
    

    let newFilteredMatchList = matches;
    let newFilteredTeamList = teams;
    let newFilteredGroupList = groups;

    // Division and team value
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      newFilteredMatchList = matches.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      newFilteredTeamList = teams.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      newFilteredGroupList = groups.filter((g) => g.division && g.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    // If logged in as captain check me I the captain of one of the team or not
    const localUser = getUserFromCookie();
    if (localUser.info?.role === UserRole.captain || localUser.info?.role === UserRole.co_captain) {
      newFilteredMatchList = captainsMatches(localUser, newFilteredTeamList, newFilteredMatchList);
    }

    setFilteredMatchList(newFilteredMatchList);
    setFilteredTeamList(newFilteredTeamList);
    setFilteredGroupList(newFilteredGroupList);

    // Making divisions list
    const divisions = currEvent?.divisions ||  '';
    const divs = divisionsToOptionList(divisions);
    setDivisionList(divs);
  }, []);

  const paginatedMatchList: IMatchExpRel[] = useMemo(() => {
    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTeams = filteredMatchList.slice(start, start + ITEMS_PER_PAGE);

    // inactive players won't have rankings
    return paginatedTeams;
  }, [filteredMatchList, currentPage]);

  if (isLoading) return <Loader />;


  return (
    <React.Fragment>

      {/* Event Menu Start */}
      <div className="event-and-menu">
        {currEvent && <CurrentEvent currEvent={currEvent} />}
        <div className="navigator mt-4">
          <UserMenuList eventId={currEvent._id} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mt-4">
        {addMatch ? (
          <div className='match-add-wrapper w-full'>
            {/* Only director and admin can create match  */}
            {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
              <>
                <button type="button" className="btn-info mb-4" onClick={() => setAddMatch(false)}>
                  Match List
                </button>

                <div className="division-selection w-full">
                  <SelectInput key={"matches-si-1"} handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList}  />
                </div>

                <MatchAdd
                  eventData={currEvent}
                  teamList={filteredTeamList}
                  eventId={currEvent._id}
                  addMatchCB={addMatchCB}
                  setIsLoading={setIsLoading}
                  showAddMatch={setAddMatch}
                  groupList={filteredGroupList}
                  currDivision={currDivision}
                />
              </>
            )}
          </div>
        ) : (
          <div className="match-list-wrapper w-full">
            {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
              <button type="button" className="btn-info mb-4" onClick={() => setAddMatch(true)}>
                Add Match
              </button>
            )}
            <br />
            {user?.info?.role !== UserRole.captain && user?.info?.role !== UserRole.co_captain && (
              <div className="division-selection w-full">
                <SelectInput key={"matches-si-2"} handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} />
              </div>
            )}
            {paginatedMatchList.length > 0 ? (
              <>
                <MatchList eventId={currEvent._id} setIsLoading={setIsLoading} matchList={paginatedMatchList} teamList={teams} refetchFunc={refetchFunc} groupList={filteredGroupList} />
                <div className="w-full">
                  <Pagination currentPage={currentPage} itemList={matches} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
                </div>
              </>
            ) : (
              <p>No match created yet!</p>
            )}
          </div>
        )}
      </div>
      <br />
    </React.Fragment>
  );
}

export default MatchesMain;

