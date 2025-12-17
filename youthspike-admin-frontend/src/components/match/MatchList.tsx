import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IGroup, IMatchExpRel, IOption, IResponse, ITeam } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';
import { DELETE_MATCHES } from '@/graphql/matches';
import { motion } from 'motion/react';
import { cardAnimate } from '@/utils/animation';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import useClickOutside from '@/hooks/useClickOutside';
import { UserRole } from '@/types/user';
import { useError } from '@/lib/ErrorProvider';
import InputField from '../elements/forms/InputField';
import Pagination from '../elements/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { useMutation } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';
import { handleError } from '@/utils/handleError';

const { initial: cInitial, animate: cAnimate, exit: cExit } = cardAnimate;

interface MatchListProps {
  eventId: string;
  matchList: IMatchExpRel[];
  teamList: ITeam[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  groupList: IGroup[];
  refetchFunc?: () => void;
}

interface MatchFilters {
  date?: string;
  opponent?: string;
  description?: string;
  group?: string | null;
}


const ITEMS_PER_PAGE = 10;

const MatchList = ({ eventId, matchList, teamList, setIsLoading, refetchFunc, groupList }: MatchListProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setActErr } = useError();
  const user = useUser();

  // Initial query params
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1'));
  const [filters, setFilters] = useState<MatchFilters>({
    date: searchParams.get('date') || EEventPeriod.CURRENT,
    opponent: searchParams.get('opponent') || undefined,
    description: searchParams.get('description') || undefined,
    group: searchParams.get('group') || null,
  });
  const [showBulkMenu, setShowBulkMenu] = useState<boolean>(false);
  const [selectedMatches, setSelectedMatches] = useState<Map<string, boolean>>(new Map());

  const bulkMenuRef = useRef<HTMLUListElement | null>(null);

  // Debounced description search
  const [debouncedDescription] = useDebounce(filters.description, 300);

  const [deleteMatchesMutation] = useMutation<{deleteMatches: IResponse}>(DELETE_MATCHES);

  useClickOutside(bulkMenuRef, () => setShowBulkMenu(false));

  /**
   * Updates URL query params to keep filters & pagination in sync
   */
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  /**
   * Keep URL in sync with filters and pagination
   */
  useEffect(() => {
    updateUrlParams({
      page: currentPage.toString(),
      date: filters.date || null,
      opponent: filters.opponent || null,
      description: debouncedDescription || null,
      group: filters.group || null,
    });
  }, [currentPage, filters.date, filters.opponent, debouncedDescription, filters.group, updateUrlParams]);

  /**
   * Sorted matches (completed last, then by numeric description)
   */
  const sortedMatches = useMemo(() => {
    if (!matchList) return [];
    return [...matchList].filter(Boolean).sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      const numA = parseInt(a.description?.replace(/\D/g, '') ?? '0', 10);
      const numB = parseInt(b.description?.replace(/\D/g, '') ?? '0', 10);
      return numA - numB;
    });
  }, [matchList]);

  /**
   * Filtered matches (role, date, opponent, description, group)
   */
  const filteredMatches = useMemo(() => {
    let list = [...sortedMatches];
    if (list.length === 0) return [];

    // Role filters
    if (user.info?.captainplayer) {
      list = list.filter(
        (m) =>
          m.teamA?.captain === user.info?.captainplayer ||
          m.teamA?.captain?._id === user.info?.captainplayer ||
          m.teamB?.captain === user.info?.captainplayer ||
          m.teamB?.captain?._id === user.info?.captainplayer,
      );
    }
    if (user.info?.cocaptainplayer) {
      list = list.filter(
        (m) =>
          m.teamA?.cocaptain === user.info?.cocaptainplayer ||
          m.teamA?.cocaptain?._id === user.info?.cocaptainplayer ||
          m.teamB?.cocaptain === user.info?.cocaptainplayer ||
          m.teamB?.cocaptain?._id === user.info?.cocaptainplayer,
      );
    }

    // Date filter
    if (filters.date) {
      list = list.filter((m) => m.date && filters.date === validateMatchDatetime(m.date));
    }

    // Opponent filter
    if (filters.opponent) {
      list = list.filter((m) => m.teamA?._id === filters.opponent || m.teamB?._id === filters.opponent);
    }

    // Description filter
    if (filters.description) {
      const text = filters.description.trim().toLowerCase();
      list = list.filter((m) => m.description?.toLowerCase().includes(text));
    }

    // Group filter
    if (filters.group) {
      list = list.filter((m) => (m.group?._id || m.group) === filters.group);
    }

    return list;
  }, [sortedMatches, filters, user.info?.captainplayer, user.info?.cocaptainplayer]);

  /**
   * Paginated matches
   */
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatches, currentPage]);

  /**
   * Opponent select options
   */
  const opponentOptions = useMemo(() => {
    const division = SessionStorageService.getItem(DIVISION);
    const notSameCaptain = (t: ITeam) => t.captain?._id !== user.info?.captainplayer && t.cocaptain?._id !== user.info?.cocaptainplayer;

    return teamList
      .filter((t) => {
        if (!t) return false;
        const sameDivision = division ? t.division?.toString().trim().toUpperCase() === division.toString().trim().toUpperCase() : true;
        return notSameCaptain(t) && sameDivision;
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }));
  }, [teamList, user.info?.captainplayer, user.info?.cocaptainplayer]);

  /**
   * Group select options
   */
  const groupOptions = useMemo<IOption[]>(() => {
    const options: IOption[] = [{ id: 0, value: '', text: 'All' }];
    groupList?.forEach((g, i) => {
      if (g) options.push({ id: i + 1, value: g._id, text: g.name });
    });
    return options;
  }, [groupList]);

  /**
   * Unified filter change handler
   */
  const handleFilterChange = useCallback((e: React.SyntheticEvent, key: keyof MatchFilters) => {
    const input = e.target as HTMLInputElement | HTMLSelectElement;
    setFilters((prev) => ({ ...prev, [key]: input.value || undefined }));
    setCurrentPage(1); // reset pagination on filter change
  }, []);

  /**
   * Match selection (bulk or single)
   */
  const toggleSelectMatch = useCallback((e: React.SyntheticEvent, matchId: string) => {
    const input = e.target as HTMLInputElement;
    setSelectedMatches((prev) => {
      const newMap = new Map(prev);
      if (input.checked) newMap.set(matchId, true);
      else newMap.delete(matchId);
      return newMap;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (e: React.SyntheticEvent) => {
      const input = e.target as HTMLInputElement;
      if (input.checked) {
        const all = new Map<string, boolean>();
        sortedMatches.forEach((m) => m?._id && all.set(m._id, true));
        setSelectedMatches(all);
      } else {
        setSelectedMatches(new Map());
      }
    },
    [sortedMatches],
  );

  /**
   * Bulk delete (Do not remove this function)
   */
  const handleDeleteSelected = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (selectedMatches.size === 0) return;

      try {
        setIsLoading(true);
        const ids = Array.from(selectedMatches.keys()).filter(Boolean);
        if (ids.length === 0) return;

        const response = await deleteMatchesMutation({ variables: { matchIds: ids } });
        const success = await handleResponseCheck(response.data?.deleteMatches, setActErr );
        if (!success) return;

        setSelectedMatches(new Map());
        refetchFunc ? refetchFunc() : window.location.reload();
      } catch (error: any) {
        handleError({ error, setActErr });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedMatches, deleteMatchesMutation, setIsLoading, setActErr, refetchFunc],
  );

  const handleMoveSelected = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
  }, []);
  

  return (
    <div className="matchList w-full flex flex-col md:flex-row justify-between gap-4 flex-wrap">
      {/* Filters */}
      <div className="search-filter w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-2">
        <SelectInput name="period" optionList={eventPeriods} label="Date" defaultValue={filters.date || EEventPeriod.CURRENT} handleSelect={(e) => handleFilterChange(e, 'date')} />
        <SelectInput
          name="opponent"
          label="Oponent"
          optionList={opponentOptions.map((t, i) => ({ id: i + 1, text: t?.name || 'Unknown Team', value: t?._id || '' }))}
          value={filters.opponent || ''}
          handleSelect={(e) => handleFilterChange(e, 'opponent')}
        />
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <SelectInput name="group" label="group" optionList={groupOptions} value={filters.group || ''} handleSelect={(e) => handleFilterChange(e, 'group')} />
        )}
        <InputField type="text" name="description" required={false} value={filters.description || ''} handleInputChange={(e) => handleFilterChange(e, 'description')} />
      </div>

      {/* Bulk Actions */}
      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && paginatedMatches.length > 0 && (
        <div className="bulk-selection relative w-full flex justify-between">
          <div className="input-group flex items-center gap-2 justify-between">
            <input onClick={toggleSelectAll} type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role="presentation" onClick={() => setShowBulkMenu((prev) => !prev)} />
          </div>
          <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowBulkMenu((prev) => !prev)}>
            <p>A-Z</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>
          <ul ref={bulkMenuRef} className={`${showBulkMenu ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
            {/* <li role="presentation" className="capitalize" onClick={handleDeleteSelected}>
              delete
            </li> */}
            <li role="presentation" className="capitalize" onClick={handleMoveSelected}>
              Move
            </li>
          </ul>
        </div>
      )}

      {/* Match List */}
      <div className="match-list w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedMatches.map((match, i) => (
          <motion.div initial={cInitial} animate={cAnimate} exit={cExit} className="match-card w-full rounded-xl" key={match._id}>
            <MatchCard
              eventId={eventId}
              match={match}
              isChecked={selectedMatches.get(match._id) ?? false}
              sl={i + 1}
              refetchFunc={refetchFunc}
              handleSelectMatch={toggleSelectMatch}
              setActErr={setActErr}
            />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="w-full">
        <Pagination currentPage={currentPage} itemList={filteredMatches} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
};

export default MatchList;
