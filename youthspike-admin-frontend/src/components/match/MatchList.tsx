import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IGroup, IMatchExpRel, IOption, ITeam } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';
import { useMutation } from '@apollo/client';
import { DELETE_MATCHES } from '@/graphql/matches';
import { handleError, handleResponse } from '@/utils/handleError';
import { motion } from 'motion/react';
import { cardAnimate } from '@/utils/animation';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import useClickOutside from '@/hooks/useClickOutside';
import { getDivisionFromStore } from '@/utils/localStorage';
import { UserRole } from '@/types/user';
import { useError } from '@/lib/ErrorProvider';
import InputField from '../elements/forms/InputField';
import Pagination from '../elements/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from 'use-debounce';

const { initial: cInitial, animate: cAnimate, exit: cExit, transition: cTransition } = cardAnimate;

interface IMatchListProps {
  eventId: string;
  matchList: IMatchExpRel[];
  teamList: ITeam[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  groupList: IGroup[];
  refetchFunc?: () => Promise<void>;
}

interface IFilterParams {
  date?: string;
  opponent?: string;
  description?: string;
  group?: string | null;
}

const ITEMS_PER_PAGE = 10;

const MatchList = ({ eventId, matchList, teamList, setIsLoading, refetchFunc, groupList }: IMatchListProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial state from query params
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialDate = searchParams.get('date') || EEventPeriod.CURRENT;
  const initialOpponent = searchParams.get('opponent') || '';
  const initialDescription = searchParams.get('description') || '';
  const initialGroup = searchParams.get('group') || '';

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [filterParams, setFilterParams] = useState<IFilterParams>({
    date: initialDate,
    opponent: initialOpponent || undefined,
    description: initialDescription || undefined,
    group: initialGroup || null,
  });
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [checkedMatches, setCheckedMatches] = useState<Map<string, boolean>>(new Map());
  const actionEl = useRef<HTMLUListElement | null>(null);

  // Debounce description filter to avoid too many URL updates
  const [debouncedDescription] = useDebounce(filterParams.description, 300);

  const [deleteMultipleMatches] = useMutation(DELETE_MATCHES);
  const user = useUser();
  const { setActErr } = useError();

  useClickOutside(actionEl, () => {
    setShowFilter(false);
  });

  // Function to update query params
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Replace instead of push to avoid cluttering history
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Update URL when filters or pagination change
  useEffect(() => {
    updateQueryParams({
      page: currentPage.toString(),
      date: filterParams.date || null,
      opponent: filterParams.opponent || null,
      description: debouncedDescription || null,
      group: filterParams.group || null,
    });
  }, [currentPage, filterParams.date, filterParams.opponent, debouncedDescription, filterParams.group, updateQueryParams]);

  // Memoize sorted match list to avoid re-sorting on every render
  const sortedMatchList = useMemo(() => {
    if (!matchList) return [];

    return [...matchList]
      .filter((match) => match != null)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed);
        }
        const numA = parseInt(a.description?.replace(/\D/g, '') ?? '0', 10);
        const numB = parseInt(b.description?.replace(/\D/g, '') ?? '0', 10);
        return numA - numB;
      });
  }, [matchList]);

  // Memoize selectable opponents to avoid re-computation
  const selectableOpponents = useMemo(() => {
    const division = getDivisionFromStore();
    const isDifferentCaptain = (t: ITeam) => t.captain?._id !== user.info?.captainplayer && t.cocaptain?._id !== user.info?.cocaptainplayer;

    return teamList
      .filter((t) => {
        if (!t) return false;
        const sameDivision = division ? t.division?.toString().trim().toUpperCase() === division.toString().trim().toUpperCase() : true;
        return isDifferentCaptain(t) && sameDivision;
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }));
  }, [teamList, user.info?.captainplayer, user.info?.cocaptainplayer]);

  // Memoize group options
  const groupOptions = useMemo(() => {
    const options: IOption[] = [{ id: 0, value: '', text: 'All' }];

    groupList?.forEach((g, index) => {
      if (g) {
        options.push({ id: index + 1, value: g._id, text: g.name });
      }
    });

    return options;
  }, [groupList]);

  // Memoize filtered match list to avoid re-filtering on every render
  const filteredMatchList = useMemo(() => {
    let filteredList = [...sortedMatchList];

    // Early return if no matches
    if (filteredList.length === 0) return [];

    // User role-based filtering
    if (user.info?.captainplayer) {
      filteredList = filteredList.filter(
        (ml) =>
          ml.teamA?.captain === user.info?.captainplayer ||
          ml.teamA?.captain?._id === user.info?.captainplayer ||
          ml.teamB?.captain === user.info?.captainplayer ||
          ml.teamB?.captain?._id === user.info?.captainplayer,
      );
    }

    if (user.info?.cocaptainplayer) {
      filteredList = filteredList.filter(
        (ml) =>
          ml.teamA?.cocaptain === user.info?.cocaptainplayer ||
          ml.teamA?.cocaptain?._id === user.info?.cocaptainplayer ||
          ml.teamB?.cocaptain === user.info?.cocaptainplayer ||
          ml.teamB?.cocaptain?._id === user.info?.cocaptainplayer,
      );
    }

    // Date filtering
    if (filterParams.date) {
      filteredList = filteredList.filter((m) => m.date && filterParams.date === validateMatchDatetime(m.date));
    }

    // Opponent filtering
    if (filterParams.opponent) {
      filteredList = filteredList.filter((m) => m.teamA?._id === filterParams.opponent || m.teamB?._id === filterParams.opponent);
    }

    // Description filtering
    if (filterParams.description) {
      const searchText = filterParams.description.trim().toLowerCase();
      filteredList = filteredList.filter((match) => match.description?.toLowerCase().includes(searchText));
    }

    // Group filtering
    if (filterParams.group || filterParams.group === '') {
      if (filterParams.group) {
        filteredList = filteredList.filter((m) => (m.group?._id || m.group) === filterParams.group);
      }
    }

    return filteredList;
  }, [sortedMatchList, filterParams, user.info?.captainplayer, user.info?.cocaptainplayer]);

  // Memoize paginated matches
  const paginatedMatchList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatchList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatchList, currentPage]);

  const handlePeriodChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prev) => ({ ...prev, date: inputEl.value }));
    setCurrentPage(1); // Reset page when this specific filter changes
  }, []);

  const handleDescriptionChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setFilterParams((prev) => ({ ...prev, description: inputEl.value }));
    setCurrentPage(1); // Reset page when this specific filter changes
  }, []);

  const handleOpponentChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prev) => ({ ...prev, opponent: inputEl.value }));
    setCurrentPage(1); // Reset page when this specific filter changes
  }, []);

  const handleGroupChange = useCallback((e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prev) => ({ ...prev, group: inputEl.value }));
    setCurrentPage(1); // Reset page when this specific filter changes
  }, []);

  const handleSelectMatch = useCallback((e: React.SyntheticEvent, matchId: string) => {
    const inputEl = e.target as HTMLInputElement;
    setCheckedMatches((prev) => {
      const newMap = new Map(prev);
      if (inputEl.checked) {
        newMap.set(matchId, true);
      } else {
        newMap.delete(matchId);
      }
      return newMap;
    });
  }, []);

  const handleCheckAllToggle = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      if (inputEl.checked) {
        const newMap = new Map();
        sortedMatchList.forEach((m) => {
          if (m && m._id) {
            newMap.set(m._id, true);
          }
        });
        setCheckedMatches(newMap);
      } else {
        setCheckedMatches(new Map());
      }
    },
    [sortedMatchList],
  );

  const handleDeleteMatches = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (checkedMatches.size <= 0) return;

      try {
        setIsLoading(true);
        const checkedMatchIds = Array.from(checkedMatches.keys()).filter(Boolean);

        if (checkedMatchIds.length === 0) return;

        const response = await deleteMultipleMatches({ variables: { matchIds: checkedMatchIds } });
        const success = await handleResponse({ response: response.data.deleteMatches, setActErr });

        if (!success) return;

        setCheckedMatches(new Map());
        if (refetchFunc) {
          await refetchFunc();
        } else {
          window.location.reload();
        }
      } catch (error: any) {
        handleError({ error, setActErr });
      } finally {
        setIsLoading(false);
      }
    },
    [checkedMatches, deleteMultipleMatches, setIsLoading, setActErr, refetchFunc],
  );

  const handleMoveMatches = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="matchList w-full flex flex-col md:flex-row justify-between gap-4 flex-wrap">
      <div className="search-filter w-full mb-8">
        <SelectInput name="period" optionList={eventPeriods} label="Date" value={filterParams.date || EEventPeriod.CURRENT} handleSelect={handlePeriodChange} />
        <SelectInput
          name="opponent"
          optionList={selectableOpponents.map((t, i) => ({
            id: i + 1,
            text: t?.name || 'Unknown Team',
            value: t?._id || '',
          }))}
          value={filterParams.opponent || ''}
          handleSelect={handleOpponentChange}
        />
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <SelectInput name="group" optionList={groupOptions} value={filterParams.group || ''} handleSelect={handleGroupChange} />
        )}
        <InputField type="text" name="description" required={false} value={filterParams.description || ''} handleInputChange={handleDescriptionChange} />
      </div>

      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
        <div className="bulk-selection relative w-full flex justify-between">
          <div className="input-group flex items-center gap-2 justify-between">
            <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role="presentation" onClick={() => setShowFilter((prev) => !prev)} />
          </div>
          <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prev) => !prev)}>
            <p>A-Z</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>

          <ul ref={actionEl} className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
            <li role="presentation" className="capitalize" onClick={handleDeleteMatches}>
              delete
            </li>
            <li role="presentation" className="capitalize" onClick={handleMoveMatches}>
              Move
            </li>
          </ul>
        </div>
      )}

      <div className="match-list w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedMatchList.map((match: IMatchExpRel, i) => (
          <motion.div initial={cInitial} animate={cAnimate} exit={cExit} className="match-card w-full rounded-xl" key={match._id}>
            <MatchCard
              eventId={eventId}
              match={match}
              isChecked={checkedMatches.get(match._id) ?? false}
              sl={i + 1}
              refetchFunc={refetchFunc}
              handleSelectMatch={handleSelectMatch}
              setActErr={setActErr}
            />
          </motion.div>
        ))}
      </div>

      <div className="w-full">
        <Pagination currentPage={currentPage} itemList={filteredMatchList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
};

export default MatchList;
