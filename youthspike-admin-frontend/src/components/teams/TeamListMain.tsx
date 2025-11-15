'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList } from '@/utils/helper';
import { IGetEventWithTeamsQuery, IOption, IPlayer, IPlayerExpRel, ITeam } from '@/types';
import MultiPlayerAddDialog from './MultiPlayerAddDialog';
import InputField from '../elements/forms/InputField';
import SelectInput from '../elements/forms/SelectInput';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CurrentEvent from '../event/CurrentEvent';
import UserMenuList from '../layout/UserMenuList';
import { useLdoId } from '@/lib/LdoProvider';
import { QueryRef, useReadQuery } from '@apollo/client';


interface ITeamsOfEventPage {
  queryRef: QueryRef<{ getEventWithTeams: IGetEventWithTeamsQuery }>;
}

interface IFilter {
  division: string;
  search: string;
}


function TeamListMain({ queryRef }: ITeamsOfEventPage) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ldoIdUrl } = useLdoId();
  const {data} = useReadQuery(queryRef);
  

  // Initialize filters from query params
  const initialDivision = searchParams.get('division') || '';
  const initialSearch = searchParams.get('search') || '';

  if(!data || !data?.getEventWithTeams || !data?.getEventWithTeams?.data){
    console.log(data);
    const error =  new Error("Unable to fetch data properly!", );
    error.name = "Something went wrong!";
    throw error;
  }


  const importerEl = useRef<HTMLDialogElement | null>(null);


  // Local State
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<IFilter>({
    division: initialDivision,
    search: initialSearch
  });


  const {teams, groups, players, event} = data?.getEventWithTeams?.data;

  // Division list options
  const divisionList: IOption[] = useMemo(() => {
    return divisionsToOptionList(event?.divisions || '');
  }, [event]);

  // Player map for O(1) lookup
  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p._id, p]));
  }, [players]);

  // Teams with resolved captain
  const teamList: ITeam[] = useMemo(() => {
    if (!teams?.length) return [];

    const newTeamList: ITeam[] = [];
    for (let i = 0; i < teams.length; i++) {
      const team = {...teams[i]};
      team.captain = team.captain ? (playerMap.get(String(team.captain)) as IPlayerExpRel) || null : null;
      const players: IPlayerExpRel[] = [];
      for (let j = 0; j < team.players.length; j++) {
        const player = team.players[j];
        if(playerMap.has(String(player))){
          players.push(playerMap.get(String(player)) as IPlayerExpRel);
        }
      }
      team.players = players;
      newTeamList.push(team);
      
    }
    return newTeamList;
  }, [teams, playerMap]);

  const groupList = useMemo(() => groups || [], [groups]);

  // Filtered teams
  const filteredTeamList = useMemo(() => {
    const searchTerm = filter.search.trim().toLowerCase();
    const divisionTerm = filter.division.trim().toLowerCase();

    const result = teamList.filter((team) => {
      if (divisionTerm && team.division?.trim().toLowerCase() !== divisionTerm) {
        return false;
      }
      if (searchTerm) {
        const teamName = team.name?.toLowerCase() || '';
        return teamName.includes(searchTerm);
      }
      return true;
    });

    // Sort once, after filtering
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [teamList, filter.division, filter.search]);

  // Filtered groups
  const filteredGroupList = useMemo(() => {
    const divisionTerm = filter.division.trim().toLowerCase();
    return divisionTerm
      ? groupList.filter((group) => group.division?.trim().toLowerCase() === divisionTerm)
      : groupList;
  }, [groupList, filter.division]);

  // Update URL with filters
  const updateUrlWithFilters = useCallback(
    (newFilter: IFilter) => {
      const params = new URLSearchParams(searchParams.toString());

      newFilter.division ? params.set('division', newFilter.division) : params.delete('division');
      newFilter.search ? params.set('search', newFilter.search) : params.delete('search');

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Handlers
  const handleDivisionChange = useCallback(
    (e: React.SyntheticEvent) => {
      const divisionValue = (e.target as HTMLSelectElement).value;
      const newFilter = { ...filter, division: divisionValue };

      setFilter(newFilter);
      updateUrlWithFilters(newFilter);
    },
    [filter, updateUrlWithFilters],
  );

  const handleSearchChange = useCallback(
    (e: React.SyntheticEvent) => {
      const searchValue = (e.target as HTMLInputElement).value;
      const newFilter = { ...filter, search: searchValue };

      setFilter(newFilter);
      updateUrlWithFilters(newFilter);
    },
    [filter, updateUrlWithFilters],
  );
  
  const refetchFunc = useCallback(() => {
    window.location.reload();
  }, []);


  if (isLoading) return <Loader />;

  return (
    <>
      <MultiPlayerAddDialog
        divisionList={divisionList}
        eventId={event._id}
        importerEl={importerEl}
        setIsLoading={setIsLoading}
      />

      {/* Event Menu Start */}
      <div className="event-and-menu">
        {event && <CurrentEvent currEvent={event} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={event._id} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <SelectInput
          name="division"
          label="division"
          optionList={divisionList}
          value={filter.division}
          handleSelect={handleDivisionChange}
        />
        <InputField
          name="search"
          type="text"
          value={filter.search}
          placeholder="Search teams..."
          handleInputChange={handleSearchChange}
        />
      </div>

      <div className="actions mt-8 flex flex-col sm:flex-row justify-between gap-4">
        <Link
          href={`/${event._id}/teams/new/${ldoIdUrl}`}
          className="btn-info text-center"
        >
          Add New Team
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            importerEl.current?.showModal();
          }}
          className="btn-info text-center"
        >
          Import Teams
        </button>
      </div>

      {filteredTeamList.length > 0 ? (
        <div className="mt-8">
          <TeamList
            groupList={filteredGroupList}
            eventId={event._id}
            teamList={filteredTeamList}
            setIsLoading={setIsLoading}
            refetchFunc={refetchFunc}
          />
        </div>
      ) : (
        <p className="text-center text-gray-400">
          {filter.division || filter.search
            ? 'No teams match your filters.'
            : 'No teams available.'}
        </p>
      )}
    </>
  );
}

export default TeamListMain;
