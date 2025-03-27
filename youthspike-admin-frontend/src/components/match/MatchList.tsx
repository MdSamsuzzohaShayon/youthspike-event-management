import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IGroup, IMatchExpRel, IOption, ITeam } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import TextInput from '../elements/forms/TextInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';
import { useMutation } from '@apollo/client';
import { DELETE_MATCHES } from '@/graphql/matches';
import { handleError, handleResponse } from '@/utils/handleError';
import { motion } from 'framer-motion';
import { cardAnimate } from '@/utils/animation';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import useClickOutside from '@/hooks/useClickOutside';
import { getDivisionFromStore } from '@/utils/localStorage';
import { UserRole } from '@/types/user';
import { useError } from '@/lib/ErrorContext';



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
    let filteredList = [...sortedMatchList];

    if (user.info?.captainplayer) {
      // Filter matches where user is a captain
      filteredList = filteredList.filter(
        (ml) =>
          ml.teamA.captain?._id === user.info?.captainplayer ||
          ml.teamB.captain?._id === user.info?.captainplayer
      );
    }

    if (filterParams.date) {
      // Filter by selected date
      filteredList = filteredList.filter(
        (m) => filterParams.date === validateMatchDatetime(m.date)
      );
    }

    if (filterParams.opponent) {
      // Filter by selected opponent
      filteredList = filteredList.filter(
        (m) =>
          filterParams.opponent === m.teamA._id ||
          filterParams.opponent === m.teamB._id
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
        filteredList = filteredList.filter((m) => (m.group?._id || m.group) === filterParams.group);
      }
    }

    setFilteredMatchList([...filteredList]);
  };

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setFilterParams((prevState) => ({ ...prevState, date: inputEl.value }));
  };

  const handleDescriptionChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
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
    const isDifferentCaptain = (t: ITeam) => t.captain?._id !== user.info?.captainplayer && t.cocaptain?._id !== user.info?.cocaptainplayer;

    return teamList.filter((t) => {
      const sameDivision = division
        ? t.division.toString().trim().toUpperCase() === division.toString().trim().toUpperCase()
        : true;
      return isDifferentCaptain(t) && sameDivision;
    });
  };

  const getSelectableGroups: IOption[] = (useCallback(() => {
    const groupOptionList: IOption[] = [];
    groupOptionList.push({ value: "", text: "All" });
    if (groupList && groupList.length > 0) {
      groupList.forEach((g) => { groupOptionList.push({ value: g._id, text: g.name }) });
    }
    return groupOptionList;
  }, [groupList]))();


  const handleSelectMatch = (e: React.SyntheticEvent, matchId: string) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedMatches: Map<string, boolean> = new Map(checkedMatches);
    if (inputEl.checked) {
      newCheckedMatches.set(matchId, true);
    } else {
      newCheckedMatches.set(matchId, false);
    }
    setCheckedMatches(newCheckedMatches);
    // e.preventDefault();
  }


  const handleCheckAllToggle = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedMatches: Map<string, boolean> = new Map();
    if (inputEl.checked) {
      matchList.forEach((m) => {
        newCheckedMatches.set(m._id, true);
      });
      setCheckedMatches(newCheckedMatches);
    } else {
      setCheckedMatches(new Map());
    }
  }

  const handleDeleteMatches = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkedMatches.size <= 0) return;
    try {
      setIsLoading(true);
      const checkedMatchIds = Array.from(checkedMatches)
        .filter(([_, isChecked]) => isChecked) // Filter for checked items
        .map(([matchId]) => matchId); // Map to just the match IDs
      const response = await deleteMultipleMatches({ variables: { matchIds: checkedMatchIds } });
      const success = handleResponse({ response: response.data.deleteMatches, setActErr });
      if (!success) return;
      setCheckedMatches(new Map());
      if (refetchFunc) await refetchFunc()
    } catch (error: any) {
      handleError({ error, setActErr })
    } finally {
      setIsLoading(false);
    }
  }

  const handleMoveMatches = (e: React.SyntheticEvent) => {
    e.preventDefault();
  }

  useEffect(() => {
    if (matchList) {
      const sortedMatch = [...matchList].sort((a, b) => {
        // Condition 1: Sort by `completed` status (false first)
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed); // False (0) comes before True (1)
        }
        // Condition 2: Sort numerically by the number in `description` (e.g., M1, M2)
        const numA = parseInt(a.description?.replace(/\D/g, "") ?? "0", 10); // Remove non-digits, fallback to 0
        const numB = parseInt(b.description?.replace(/\D/g, "") ?? "0", 10); // Remove non-digits, fallback to 0
        return numA - numB; // Sort numerically in ascending order
      });

      setSortedMatchList(sortedMatch); // Update state with the sorted list
    }
  }, [matchList]);

  useEffect(() => {
    filterMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, matchList, sortedMatchList]);

  return (
    <div className="matchList w-full flex flex-col md:flex-row justify-between gap-4 flex-wrap">
      <div className="search-filter w-full mb-8">
        <SelectInput
          name="period"
          optionList={eventPeriods}
          label="Date"
          rw="w-3/6"
          vertical
          defaultValue={EEventPeriod.CURRENT}
          handleSelect={handlePeriodChange}
        />
        <SelectInput
          name="opponent"
          optionList={getSelectableOpponents().map((t) => ({
            text: t.name,
            value: t._id
          }))}
          lblTxt="Opponent"
          rw="w-3/6"
          vertical
          handleSelect={handleOpponentChange}
        />
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <SelectInput
            name="group"
            optionList={getSelectableGroups}
            lblTxt="Group"
            rw="w-3/6"
            vertical
            handleSelect={handleGroupChange}
          />
        )}
        <TextInput
          name="description"
          vertical
          required={false}
          handleInputChange={handleDescriptionChange}
        />

      </div>

      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
        <div className="bulk-selection relative w-full flex justify-between">
          <div className="input-group flex items-center gap-2 justify-between"  >
            <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role='presentation' onClick={() => setShowFilter((prevState) => !prevState)} />
          </div>
          <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
            <p>A-Z</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>

          {/* Bulk Action start  */}
          <ul ref={actionEl} className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
            <li role="presentation" className='capitalize' onClick={handleDeleteMatches}>
              delete
            </li>

            <li role="presentation" className='capitalize' onClick={handleMoveMatches}>
              Move
            </li>
          </ul>
          {/* Bulk Action end  */}
        </div>
      )}

      <div className="match-list w-full flex justify-between items-center flex-wrap">
        {filteredMatchList.map((match: IMatchExpRel, i) => (
          <motion.div initial={cInitial} animate={cAnimate} exit={cExit} transition={cTransition} className="match-card w-full md:w-5/12 " key={match._id}>
            <MatchCard
              eventId={eventId}
              match={match}
              isChecked={checkedMatches.get(match._id) ?? false}
              sl={i + 1}
              refetchFunc={refetchFunc}
              handleSelectMatch={handleSelectMatch}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MatchList;
