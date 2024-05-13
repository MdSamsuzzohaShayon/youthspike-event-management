import React, { useState, useEffect } from 'react';
import { IError, IMatchExpRel, ITeam } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import TextInput from '../elements/forms/TextInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';

interface IMatchListProps {
  eventId: string;
  matchList: IMatchExpRel[];
  teamList: ITeam[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  refetchFunc?: () => Promise<void>;
}

interface IFilterParams {
  date?: string;
  opponent?: string;
  description?: string;
}

const MatchList: React.FC<IMatchListProps> = ({
  eventId,
  matchList,
  teamList,
  setIsLoading,
  setActErr,
  refetchFunc
}) => {
  const [filterParams, setFilterParams] = useState<IFilterParams>({date: EEventPeriod.CURRENT});
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
  const user = useUser();

  // Update filtered match list when matchList changes
  useEffect(() => {
    setFilteredMatchList([...matchList]);
  }, [matchList]);

  const filterMatches = () => {
    let filteredList = [...matchList];

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

  const getSelectableOpponents = () => {
    return teamList.filter(
      (t) =>
        t.captain?._id !== user.info?.captainplayer &&
        t.cocaptain?._id !== user.info?.cocaptainplayer
    );
  };

  useEffect(() => {
    filterMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, matchList]);

  return (
    <div className="matchList w-full flex flex-col md:flex-row justify-between gap-1 flex-wrap">
      <div className="search-filter w-full mb-8">
        <SelectInput
          name="period"
          optionList={eventPeriods.map((p) => ({ text: p, value: p }))}
          lblTxt="Date"
          rw="w-3/6"
          vertical
          defaultValue={EEventPeriod.CURRENT}
          handleSelect={handlePeriodChange}
        />
        <TextInput
          name="description"
          vertical
          required={false}
          handleInputChange={handleDescriptionChange}
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
      </div>

      {filteredMatchList.map((match: IMatchExpRel, i) => (
        <MatchCard
          key={match._id}
          eventId={eventId}
          match={match}
          sl={i + 1}
          setIsLoading={setIsLoading}
          setActErr={setActErr}
          refetchFunc={refetchFunc}
        />
      ))}
    </div>
  );
};

export default MatchList;
