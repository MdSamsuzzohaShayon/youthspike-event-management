/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList } from '@/utils/helper';
import { IEventExpRel, IGroup, IGroupExpRel, IOption, IPlayerExpRel, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CurrentEvent from '../event/CurrentEvent';
import UserMenuList from '../layout/UserMenuList';
import { useLdoId } from '@/lib/LdoProvider';
import MultiPlayerAddDialog from './MultiPlayerAddDialog';
import InputField from '../elements/forms/InputField';
import SelectInput from '../elements/forms/SelectInput';

interface IEventDetail {
  event: IEventExpRel;
  teams: ITeam[];
  groups: IGroupExpRel[];
  players: IPlayerExpRel[];
}

interface ITeamsOfEventPage {
  eventDetail: IEventDetail;
}

interface IFilter {
  division: string;
  search: string;
}

// Default filter state
const DEFAULT_FILTER: IFilter = {
  division: '',
  search: '',
};

function TeamListMain({ eventDetail }: ITeamsOfEventPage) {
  // Hooks
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ldoIdUrl } = useLdoId();

  // Refs
  const importerEl = useRef<HTMLDialogElement | null>(null);

  // Local State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<IFilter>(DEFAULT_FILTER);

  // Memoized derived state - optimized for performance
  const divisionList = useMemo(() => {
    const divisions = eventDetail.event?.divisions || '';
    return divisionsToOptionList(divisions);
  }, [eventDetail.event?.divisions]);

  // Create player map for O(1) lookups
  const playerMap = useMemo(() => {
    return new Map(eventDetail.players.map((p) => [p._id, p]));
  }, [eventDetail.players]);

  // Optimized team list with captain resolution
  const teamList = useMemo(() => {
    return (
      eventDetail.teams?.map((team) => ({
        ...team,
        captain: team.captain ? playerMap.get(String(team.captain)) || null : null,
      })) || []
    );
  }, [eventDetail.teams, playerMap]);

  const groupList = useMemo(() => eventDetail.groups || [], [eventDetail.groups]);

  // Filter teams based on current filter criteria - optimized with early returns
  const filteredTeamList = useMemo(() => {
    const { division, search } = filter;
    const searchTerm = search.toLowerCase().trim();
    const divisionTerm = division.trim().toLowerCase();

    return teamList
      .filter((team) => {
        // Early return if division doesn't match
        if (divisionTerm && team.division?.trim().toLowerCase() !== divisionTerm) {
          return false;
        }

        // Check search term if provided
        if (searchTerm) {
          const teamName = team.name?.toLowerCase() || '';
          return teamName.includes(searchTerm);
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamList, filter]);

  // Filter groups based on division
  const filteredGroupList = useMemo(() => {
    const divisionTerm = filter.division.trim().toLowerCase();
    if (!divisionTerm) return groupList;

    return groupList.filter((group) => group.division?.trim().toLowerCase() === divisionTerm);
  }, [groupList, filter.division]);

  // Update URL with filter parameters
  const updateUrlWithFilters = useCallback(
    (newFilter: IFilter) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newFilter.division) {
        params.set('division', newFilter.division);
      } else {
        params.delete('division');
      }

      if (newFilter.search) {
        params.set('search', newFilter.search);
      } else {
        params.delete('search');
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Event handlers
  const handleDivisionChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLSelectElement;
      const divisionValue = inputEl.value;
      const newFilter = { ...filter, division: divisionValue };

      setFilter(newFilter);
      updateUrlWithFilters(newFilter);

      if (divisionValue === '') {
        removeDivisionFromStore();
      } else {
        setDivisionToStore(divisionValue);
      }
    },
    [filter, updateUrlWithFilters],
  );

  const handleSearchChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      const searchValue = inputEl.value;
      const newFilter = { ...filter, search: searchValue };

      setFilter(newFilter);
      updateUrlWithFilters(newFilter);
    },
    [filter, updateUrlWithFilters],
  );

  const closeDialog = useCallback(() => {
    importerEl.current?.close();
  }, []);

  const handleClose = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      closeDialog();
    },
    [closeDialog],
  );

  const refetchFunc = useCallback(() => {
    window.location.reload();
  }, []);

  // Initialize component with URL parameters and localStorage
  useEffect(() => {
    const initializeFilters = () => {
      removeTeamFromStore();

      // Get filters from URL first, then fall back to localStorage
      const urlDivision = searchParams.get('division');
      const urlSearch = searchParams.get('search');

      const initialFilter: IFilter = {
        division: urlDivision || getDivisionFromStore() || '',
        search: urlSearch || '',
      };

      setFilter(initialFilter);

      // If we have URL params, ensure they're stored properly
      if (urlDivision) {
        setDivisionToStore(urlDivision);
      }

      // Update URL to reflect the initial state (in case we used localStorage fallback)
      if (urlDivision !== initialFilter.division || urlSearch !== initialFilter.search) {
        updateUrlWithFilters(initialFilter);
      }
    };

    initializeFilters();
  }, [searchParams, updateUrlWithFilters]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <MultiPlayerAddDialog divisionList={divisionList} eventId={eventDetail.event._id} importerEl={importerEl} setIsLoading={setIsLoading} />

      {/* Event Menu Start */}
      <div className="event-and-menu">
        {eventDetail?.event && <CurrentEvent currEvent={eventDetail.event} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={eventDetail.event._id} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <SelectInput name="division" optionList={divisionList} value={filter.division} handleSelect={handleDivisionChange} />
        <InputField name="search" type="text" value={filter.search} placeholder="Search teams..." handleInputChange={handleSearchChange} />
      </div>

      <div className="actions mt-8 flex flex-col sm:flex-row justify-between gap-4">
        <Link href={`/${eventDetail.event._id}/teams/new/${ldoIdUrl}`} className="btn-info text-center">
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
          <TeamList groupList={filteredGroupList} eventId={eventDetail.event._id} teamList={filteredTeamList} setIsLoading={setIsLoading} refetchFunc={refetchFunc} />
        </div>
      ) : (
        <p className="text-center text-gray-400">{filter.division || filter.search ? 'No teams match your filters.' : 'No teams available.'}</p>
      )}
    </React.Fragment>
  );
}

export default TeamListMain;
