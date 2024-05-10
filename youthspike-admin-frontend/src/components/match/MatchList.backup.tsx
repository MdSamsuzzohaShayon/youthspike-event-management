import React, { useState } from 'react';
import { IError, IMatchExpRel, ITeam } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';
import TextInput from '../elements/forms/TextInput';

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
  oponent?: string;
  description?: string;
}

function MatchList({ matchList, teamList, setIsLoading, setActErr, eventId, refetchFunc }: IMatchListProps) {
  const [filterParams, setFilterParams] = useState<IFilterParams>({});
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([...matchList]);
  const user = useUser();

  const searchAlgorithm = (currMatchList: IMatchExpRel[], searchText: string): IMatchExpRel[] => {
    const filteredList = currMatchList.filter((match) =>
      match.description && match.description.toLowerCase().includes(searchText)
    );
    return filteredList;
  }

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputEl = e.target as HTMLSelectElement;
    let filteredList = [...matchList];
    const newParams: IFilterParams = {};

    if (user.info?.captainplayer) {
      filteredList = filteredList.filter((ml) => ml.teamA.captain?._id === user.info?.captainplayer || ml.teamB.captain?._id === user.info?.captainplayer);
    }

    if (inputEl.value !== "") {
      filteredList = filteredList.filter((m) => inputEl.value === validateMatchDatetime(m.date));
      newParams.date = inputEl.value;
    }

    if (filterParams.oponent) {
      filteredList = filteredList.filter((m) => filterParams.oponent === m.teamA._id || filterParams.oponent === m.teamB._id);
    }

    if(filterParams.description){
      filteredList = searchAlgorithm(filteredList, filterParams.description);
    }

    setFilteredMatchList([...filteredList]);
    setFilterParams((prevState) => ({ ...prevState, ...newParams }));

    // Need to be able to sort/ search for Match Description, Opponent, and date.
  };

  const handleDescriptionMatch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    const searchText = inputEl.value.trim().toLowerCase();

    if (!searchText) {
      // If search text is empty, reset filter and display all matches
      setFilteredMatchList([...matchList]);
      setFilterParams((prevState) => ({ ...prevState, description: undefined }));
    } else {
      // Filter matches based on description containing the search text
      const filteredList = searchAlgorithm(matchList, searchText);
      setFilteredMatchList(filteredList);
      setFilterParams((prevState) => ({ ...prevState, description: searchText }));
    }
  };

  const handleOponentChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputEl = e.target as HTMLSelectElement;
    let filteredList = [...matchList];
    const newParams: IFilterParams = {};

    // Set my team if there is a logged in captain
    if (user.info?.captainplayer) {
      filteredList = filteredList.filter((ml) => ml.teamA.captain?._id === user.info?.captainplayer || ml.teamB.captain?._id === user.info?.captainplayer);
    }

    if (inputEl.value !== "") {
      filteredList = filteredList.filter((m) => inputEl.value === m.teamA._id || inputEl.value === m.teamB._id);
      newParams.oponent = inputEl.value;
    }

    if (filterParams.date) {
      filteredList = filteredList.filter((m) => filterParams.date === validateMatchDatetime(m.date));
    }

    if(filterParams.description){
      filteredList = searchAlgorithm(filteredList, filterParams.description);
    }

    setFilteredMatchList([...filteredList]);
    setFilterParams((prevState) => ({ ...prevState, ...newParams }));
  };

  const oponentTeams = teamList.filter((t) => t.captain?._id !== user.info?.captainplayer && t.cocaptain?._id !== user.info?.cocaptainplayer);



  return (
    <div className='matchList w-full flex flex-col md:flex-row justify-between gap-1 flex-wrap'>
      <div className="search-filter w-full">
        <SelectInput key="preiod-input" handleSelect={handlePeriodChange} name='period' optionList={eventPeriods.map((p) => ({ text: p, value: p }))} lblTxt='Date' rw='w-3/6' />
        <TextInput handleInputChange={handleDescriptionMatch} name='description' vertical required={false} />
        <SelectInput key="oponent-input" handleSelect={handleOponentChange} name='oponent' optionList={oponentTeams.map((t) => ({ text: t.name, value: t._id }))} lblTxt='Oponent' rw='w-3/6' />
      </div>


      {filteredMatchList && filteredMatchList.map((match: IMatchExpRel, i) => <MatchCard setActErr={setActErr} setIsLoading={setIsLoading} eventId={eventId} key={match._id} match={match} sl={i + 1} refetchFunc={refetchFunc} />)}
    </div>
  );
}

export default MatchList;