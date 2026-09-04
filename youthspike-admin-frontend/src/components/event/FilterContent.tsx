import { EFilterPage, IFilterState, IGroup, ISearchFilter } from '@/types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import SelectInput from '../elements/forms/SelectInput';
import InputField from '../elements/forms/InputField';
import { useLdoId } from '@/lib/LdoProvider';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';
import Image from 'next/image';
import routerService from '@/lib/router-service';
import { useMessage } from '@/lib/MessageProvider';

interface IFilterContentProps {
  divisions: string;
  groups: IGroup[];
  loading: boolean;
  filter: Partial<ISearchFilter>;
  onApplyFilters: (filter: IFilterState) => void;
  eventId?: string;
  showStatus?: boolean;
  filterPage: EFilterPage;
}

const pageLinks: Record<EFilterPage, string> = {
  [EFilterPage.MATCHES]: 'matches/new',
  [EFilterPage.TEAMS]: 'teams/new',
  [EFilterPage.PLAYERS]: 'players/new',
};

function FilterContent({
  divisions,
  groups,
  loading,
  filter,
  onApplyFilters,
  showStatus,
  eventId,
  filterPage,
}: IFilterContentProps) {
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();

  const [searchValue, setSearchValue] = useState(filter?.search || '');

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local search synchronized when parent filter changes.
  useEffect(() => {
    setSearchValue(filter?.search || '');
  }, [filter?.search]);

  // Cleanup debounce timer.
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const divisionList = useMemo(() => {
    if (!divisions) return [];

    return divisions.split(',').map((div, i) => ({
      id: i + 1,
      value: div.trim(),
      label: div.trim().toUpperCase(),
    }));
  }, [divisions]);

  const filteredGroups = useMemo(() => {
    const newGroups = filter?.division
      ? groups.filter(
          (g) =>
            g?.division?.trim()?.toLowerCase() ===
            filter?.division?.trim()?.toLowerCase()
        )
      : groups;

    return newGroups.map((g, i) => ({
      id: i + 1,
      value: g._id,
      label: g.name,
      text: g.name,
    }));
  }, [groups, filter?.division]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    const value = (e.target as HTMLInputElement).value;

    onApplyFilters({
      group: '',
      search: searchValue,
      status: filter?.status || '',
      division: value,
    });
  };

  const handleGroupChange = (e: React.SyntheticEvent) => {
    const value = (e.target as HTMLInputElement).value;

    onApplyFilters({
      division: filter?.division || '',
      search: searchValue,
      status: filter?.status || '',
      group: value,
    });
  };

  const handleStatusChange = (e: React.SyntheticEvent) => {
    const value = (e.target as HTMLInputElement).value;

    onApplyFilters({
      group: filter?.group || '',
      division: filter?.division || '',
      search: searchValue,
      status: value,
    });
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // Update input immediately.
    setSearchValue(value);

    // Cancel previous debounce.
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Start a new debounce.
    searchDebounceRef.current = setTimeout(() => {
      onApplyFilters({
        group: filter?.group || '',
        division: filter?.division || '',
        status: filter?.status || '',
        search: value,
      });

      searchDebounceRef.current = null;
    }, 500);
  };

  const handleRedirectPlayer = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
      routerService.push(`/players/new/${ldoIdUrl}`);
    } else {
      console.error('No event id found');
    }
  };

  const handleRedirectTeam = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
    }

    routerService.push(`/teams/new/${ldoIdUrl}`);
  };

  return (
    <form
      className="w-full animate-slide-down mb-3"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <SelectInput
          handleSelect={handleDivisionChange}
          name="division"
          optionList={divisionList}
          label="Division"
          value={filter?.division}
        />

        <SelectInput
          handleSelect={handleGroupChange}
          name="group"
          optionList={filteredGroups}
          label="Group"
          value={filter?.group}
        />
      </div>

      <div className="relative mb-3">
        <InputField
          name="search"
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      {showStatus && (
        <div className="mb-4">
          <label
            htmlFor="matchStatus"
            className="text-sm font-medium text-gray-300 mb-1 block"
          >
            Match Status
          </label>

          <select
            id="matchStatus"
            value={filter.status || ''}
            onChange={handleStatusChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm text-white"
            disabled={loading}
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="CURRENT">CURRENT</option>
            <option value="PAST">PAST</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="NOT_STARTED">NOT STARTED</option>
          </select>
        </div>
      )}

      <div className="flex gap-2">
        {filterPage === EFilterPage.MATCHES ? (
          <Link
            href={`/${eventId}/${pageLinks[filterPage]}/${ldoIdUrl}`}
            className="btn-info"
          >
            New Match
          </Link>
        ) : filterPage === EFilterPage.PLAYERS ? (
          <button
            className="btn-info flex justify-center items-center gap-x-2"
            onClick={handleRedirectPlayer}
          >
            <Image
              src="/icons/plus.svg"
              height={20}
              width={20}
              alt="new-player"
              className="w-6 h-6"
            />
            New Player
          </button>
        ) : (
          <button
            className="btn-info flex justify-center items-center gap-x-2"
            onClick={handleRedirectTeam}
          >
            <Image
              src="/icons/plus.svg"
              height={20}
              width={20}
              alt="new-team"
              className="w-6 h-6"
            />
            New Team
          </button>
        )}
      </div>
    </form>
  );
}

export default FilterContent;