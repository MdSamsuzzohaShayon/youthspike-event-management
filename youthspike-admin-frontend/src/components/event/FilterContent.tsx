import { EFilterPage, IGroup, ISearchFilter } from '@/types';
import React, { useMemo } from 'react';
import Link from 'next/link';
import SelectInput from '../elements/forms/SelectInput';
import InputField from '../elements/forms/InputField';
import { useLdoId } from '@/lib/LdoProvider';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT, DIVISION } from '@/utils/constant';
import Image from 'next/image';
import routerService from '@/lib/router-service';

interface IFilterContentProps {
  // This is optional because we can search for all matches, not just matches of a specific event
  divisions: string;
  groups: IGroup[];
  loading: boolean;
  filter: Partial<ISearchFilter>;
  updateFilter: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasUnsavedChanges: boolean;
  hasActiveFilters: boolean;
  filterPage: EFilterPage;
  eventId?: string;
  showStatus?: boolean;
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
  updateFilter,
  onApplyFilters,
  onClearFilters,
  hasUnsavedChanges,
  hasActiveFilters,
  filterPage,
  showStatus,
  eventId,
}: IFilterContentProps) {
  const { ldoIdUrl } = useLdoId();
  const divisionList = useMemo(() => {
    if (!divisions) return [];
    return [
      ...divisions.split(',').map((div, i) => ({
        id: i + 1,
        value: div.trim(),
        label: div.trim().toUpperCase(),
      })),
    ];
  }, [divisions]);

  const filteredGroups = useMemo(() => {
    const newGroups = filter.division ? groups.filter((g) => g.division.trim().toLowerCase() === filter.division!.trim().toLowerCase()) : groups;

    const groupOptions = newGroups.map((g, i) => ({
      id: i + 1,
      value: g._id,
      label: g.name,
      text: g.name,
    }));

    return [...groupOptions];
  }, [groups, filter.division]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    updateFilter('division', inputEl.value);

    if (inputEl.value) {
      SessionStorageService.setItem(DIVISION, inputEl.value.trim());
    } else {
      SessionStorageService.removeItem(DIVISION);
    }
  };


  const handleRedirectTeam = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Set event
    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
    }
    routerService.push(`/teams/new/${ldoIdUrl}`);
  }


  const handleRedirectPlayer = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Set event
    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
      routerService.push(`/players/new/${ldoIdUrl}`);
    }else{
      console.error("No event id found");
    }
    
  }

  const handleGroupChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    updateFilter('group', inputEl.value);
  };

  const handleStatusChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    updateFilter('status', inputEl.value);
  };

  const handleSearchChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    updateFilter('search', inputEl.value);
  };

  return (
    <form
      className="w-full animate-slide-down mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!loading && hasUnsavedChanges) {
          onApplyFilters();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Division */}
        <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} label="Division" value={filter.division} />

        {/* Group */}
        <SelectInput handleSelect={handleGroupChange} name="group" optionList={filteredGroups} label="Group" value={filter.group} />
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <InputField name="search" type="text" defaultValue={filter.search || ''} onChange={handleSearchChange} />
      </div>

      {/* Status Filter */}
      {showStatus && (
        <div className="mb-4">
          <label htmlFor="matchStatus" className="text-sm font-medium text-gray-300 mb-1 block">
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onApplyFilters}
          disabled={loading}
          className="btn-info"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              Applying...
            </>
          ) : (
            'Apply Filters'
          )}
        </button>

        {filterPage === EFilterPage.MATCHES ? (
          <Link href={`/${eventId}/${pageLinks[filterPage]}/${ldoIdUrl}`} className="btn-info">
            New Match
          </Link>
        ) : (
          filterPage === EFilterPage.PLAYERS ? (<button className='btn-info flex justify-center items-center gap-x-2' onClick={handleRedirectPlayer}>
            <Image src={`/icons/plus.svg`} height={20} width={20} alt='new-team' className='w-6 h-6' />
            New Player
          </button>) : (<button className='btn-info flex justify-center items-center gap-x-2' onClick={handleRedirectTeam}>
            <Image src={`/icons/plus.svg`} height={20} width={20} alt='new-team' className='w-6 h-6' />
            New Team
          </button>)
        )}

        {hasActiveFilters && (
          <button onClick={onClearFilters} disabled={loading} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && !loading && <div className="mt-2 text-sm text-yellow-400 text-center">You have unsaved filter changes</div>}
    </form>
  );
}

export default FilterContent;
