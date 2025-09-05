import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const MatchList = ({ eventId, matchList, teamList, setIsLoading, refetchFunc, groupList }: IMatchListProps) => {
  const [filterParams, setFilterParams] = useState<IFilterParams>({ date: EEventPeriod.CURRENT });
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
  const [sortedMatchList, setSortedMatchList] = useState<IMatchExpRel[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [checkedMatches, setCheckedMatches] = useState<Map<string, boolean>>(new Map());
  const actionEl = useRef<HTMLUListElement | null>(null);

  const [deleteMultipleMatches] = useMutation(DELETE_MATCHES);
  const user = useUser();
  const { setActErr } = useError();

  useClickOutside(actionEl, () => {
    setShowFilter(false);
  });

  const filterMatches = () => {
    if (sortedMatchList.length === 0) {
      setFilteredMatchList([]);
      return;
    }
    let filteredList = [...sortedMatchList];

    if (user.info?.captainplayer) {
      // Filter matches where user is a captain - with null checks
      filteredList = filteredList.filter(
        (ml) =>
          ml.teamA?.captain === user.info?.captainplayer ||
          ml.teamA?.captain?._id === user.info?.captainplayer ||
          ml.teamB?.captain === user.info?.captainplayer ||
          ml.teamB?.captain?._id === user.info?.captainplayer,
      );
    }

    if (user.info?.cocaptainplayer) {
      // Filter matches where user is a cocaptain - with null checks
      filteredList = filteredList.filter(
        (ml) =>
          ml.teamA?.cocaptain === user.info?.cocaptainplayer ||
          ml.teamA?.cocaptain?._id === user.info?.cocaptainplayer ||
          ml.teamB?.cocaptain === user.info?.cocaptainplayer ||
          ml.teamB?.cocaptain?._id === user.info?.cocaptainplayer,
      );
    }

    if (filterParams.date) {
      // Filter by selected date - with null check
      filteredList = filteredList.filter((m) => m.date && filterParams.date === validateMatchDatetime(m.date));
    }

    if (filterParams.opponent) {
      // Filter by selected opponent - with null checks
      filteredList = filteredList.filter((m) => 
        (m.teamA?._id === filterParams.opponent) || 
        (m.teamB?._id === filterParams.opponent)
      );
    }

    if (filterParams.description) {
      const searchText = filterParams.description.trim().toLowerCase();
      filteredList = filteredList.filter((match) => 
        match.description?.toLowerCase().includes(searchText)
      );
    }

    if (filterParams.group || filterParams.group === '') {
      if (filterParams.group === '') {
        filteredList = [...filteredList];
      } else if (filterParams.group) {
        filteredList = filteredList.filter((m) => 
          (m.group?._id || m.group) === filterParams.group
        );
      }
    }

    setFilteredMatchList([...filteredList]);
  };

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prevState) => ({ ...prevState, date: inputEl.value }));
  };

  const handleDescriptionChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setFilterParams((prevState) => ({ ...prevState, description: inputEl.value }));
  };

  const handleOpponentChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prevState) => ({ ...prevState, opponent: inputEl.value }));
  };

  const handleGroupChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prevState) => ({ ...prevState, group: inputEl.value }));
  };

  const getSelectableOpponents = () => {
    const division = getDivisionFromStore();
    const isDifferentCaptain = (t: ITeam) =>
      t.captain?._id !== user.info?.captainplayer &&
      t.cocaptain?._id !== user.info?.cocaptainplayer;
  
    return teamList
      .filter((t) => {
        if (!t) return false; // Skip null/undefined teams
        const sameDivision = division
          ? t.division?.toString().trim().toUpperCase() === division.toString().trim().toUpperCase()
          : true;
        return isDifferentCaptain(t) && sameDivision;
      })
      // ✅ Sort alphabetically by team name (case-insensitive)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" }));
  };

  const getSelectableGroups: IOption[] = useCallback(() => {
    const groupOptionList: IOption[] = [];
    groupOptionList.push({ id: 0, value: '', text: 'All' });
    if (groupList && groupList.length > 0) {
      groupList.forEach((g, index) => {
        if (g) { // Check if group exists
          groupOptionList.push({ id: index + 1, value: g._id, text: g.name });
        }
      });
    }
    return groupOptionList;
  }, [groupList])();

  const handleSelectMatch = (e: React.SyntheticEvent, matchId: string) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedMatches: Map<string, boolean> = new Map(checkedMatches);
    if (inputEl.checked) {
      newCheckedMatches.set(matchId, true);
    } else {
      newCheckedMatches.delete(matchId); // Use delete instead of setting to false
    }
    setCheckedMatches(newCheckedMatches);
  };

  const handleCheckAllToggle = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedMatches: Map<string, boolean> = new Map();
    if (inputEl.checked) {
      matchList.forEach((m) => {
        if (m && m._id) { // Check if match exists and has ID
          newCheckedMatches.set(m._id, true);
        }
      });
      setCheckedMatches(newCheckedMatches);
    } else {
      setCheckedMatches(new Map());
    }
  };

  const handleDeleteMatches = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkedMatches.size <= 0) return;
    try {
      setIsLoading(true);
      const checkedMatchIds = Array.from(checkedMatches)
        .filter(([_, isChecked]) => isChecked)
        .map(([matchId]) => matchId)
        .filter(matchId => matchId); // Filter out any falsy match IDs

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
  };

  const handleMoveMatches = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (matchList) {
      const sortedMatch = [...matchList]
        .filter(match => match != null) // Filter out null matches
        .sort((a, b) => {
          // Condition 1: Sort by `completed` status (false first)
          if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
          }
          // Condition 2: Sort numerically by the number in `description`
          const numA = parseInt(a.description?.replace(/\D/g, '') ?? '0', 10);
          const numB = parseInt(b.description?.replace(/\D/g, '') ?? '0', 10);
          return numA - numB;
        });

      setSortedMatchList(sortedMatch);
    }
  }, [matchList]);

  useEffect(() => {
    filterMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, matchList, sortedMatchList]);

  return (
    <div className="matchList w-full flex flex-col md:flex-row justify-between gap-4 flex-wrap">
      <div className="search-filter w-full mb-8">
        <SelectInput name="period" optionList={eventPeriods} label="Date" defaultValue={EEventPeriod.CURRENT} handleSelect={handlePeriodChange} />
        <SelectInput
          name="opponent"
          optionList={getSelectableOpponents().map((t, i) => ({
            id: i + 1,
            text: t?.name || 'Unknown Team', // Safe access to name
            value: t?._id || '', // Safe access to _id
          }))}
          handleSelect={handleOpponentChange}
        />
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && <SelectInput name="group" optionList={getSelectableGroups} handleSelect={handleGroupChange} />}
        <InputField type="text" name="description" required={false} handleInputChange={handleDescriptionChange} />
      </div>

      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
        <div className="bulk-selection relative w-full flex justify-between">
          <div className="input-group flex items-center gap-2 justify-between">
            <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image
              width={imgSize.logo}
              height={imgSize.logo}
              src="/icons/dropdown.svg"
              alt="dropdown"
              className="w-6 svg-white"
              role="presentation"
              onClick={() => setShowFilter((prevState) => !prevState)}
            />
          </div>
          <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
            <p>A-Z</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>

          {/* Bulk Action start  */}
          <ul ref={actionEl} className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
            <li role="presentation" className="capitalize" onClick={handleDeleteMatches}>
              delete
            </li>

            <li role="presentation" className="capitalize" onClick={handleMoveMatches}>
              Move
            </li>
          </ul>
          {/* Bulk Action end  */}
        </div>
      )}

      <div className="match-list w-full flex justify-between items-center flex-wrap">
        {filteredMatchList.map((match: IMatchExpRel, i) => (
          <motion.div initial={cInitial} animate={cAnimate} exit={cExit} className="match-card w-full md:w-5/12 " key={match._id}>
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
    </div>
  );
};

export default MatchList;