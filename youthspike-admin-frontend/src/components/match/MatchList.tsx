import React, { useState, useEffect } from 'react';
import { IError, IMatchExpRel, ITeam } from '@/types';
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
enum EMatchAction {
  DELETE = "DELETE",
  MOVE = "MOVE",
}

const actionList = [
  { id: 1, action: EMatchAction.DELETE, },
  { id: 2, action: EMatchAction.MOVE }
]

const MatchList = ({ eventId, matchList, teamList, setIsLoading, setActErr, refetchFunc }: IMatchListProps) => {

  const [filterParams, setFilterParams] = useState<IFilterParams>({ date: EEventPeriod.CURRENT });
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
  const [bulkMatches, setBulkMatches] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<EMatchAction | null>(null);

  const [deleteMultipleMatches] = useMutation(DELETE_MATCHES);


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

  // ===== Bulk Action =====
  const handleBulkAction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (!inputEl.value || inputEl.value === '') {
      setBulkAction(null);
    } else {
      // @ts-ignore
      setBulkAction(inputEl.value);
    }
  }

  const handleSelectMatch = (e: React.SyntheticEvent, _id: string) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.checked) {
      if (!bulkMatches.includes(_id)) setBulkMatches((prevState) => [...prevState, _id]);
      // setBulkMatches((prevState)=> [...new Set([...prevState, _id])]);
    } else {
      setBulkMatches((prevState) => prevState.filter((bm) => bm !== _id));
    }
    // e.preventDefault();
  }

  const handleConfirmBulk = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!bulkAction) return;
    if (bulkMatches.length <= 0) return;
    try {
      setIsLoading(true);
      const response = await deleteMultipleMatches({ variables: { matchIds: bulkMatches } });
      const success = handleResponse({ response: response.data.deleteMatches, setActErr });
      if(!success) return;
      setBulkMatches([]);
      setBulkAction(null);
      if(refetchFunc)await refetchFunc()
    } catch (error: any) {
      handleError({ error, setActErr })
    }finally{
      setIsLoading(false);
    }
  }

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
        <TextInput
          name="description"
          vertical
          required={false}
          handleInputChange={handleDescriptionChange}
        />

      </div>

      {bulkMatches.length > 0 && <div className="bulk-board w-full mt-4 flex justify-between items-center">
        <div className="w-4/6">
          <SelectInput name='bulk' handleSelect={handleBulkAction} optionList={actionList.map((a) => ({ value: a.action, text: a.action }))} key="bulk-action-key" vertical />
        </div>
        <button className="btn-info" onClick={handleConfirmBulk}>Ok</button>
      </div>}

      {filteredMatchList.map((match: IMatchExpRel, i) => (
        <MatchCard
          key={match._id}
          eventId={eventId}
          match={match}
          sl={i + 1}
          refetchFunc={refetchFunc}
          handleSelectMatch={handleSelectMatch}
        />
      ))}
    </div>
  );
};

export default MatchList;
