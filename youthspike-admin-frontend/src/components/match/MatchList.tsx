import React, { useState } from 'react';
import { IError, IMatchExpRel } from '@/types';
import MatchCard from './MatchCard';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';

interface IMatchListProps {
  eventId: string;
  matchList: IMatchExpRel[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  refetchFunc?: ()=> Promise<void>;
}

function MatchList({ matchList, setIsLoading, setActErr, eventId, refetchFunc }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([...matchList]);
  const user = useUser();

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputElement = e.target as HTMLSelectElement;
    let filteredList = [...matchList];

    if (user.info?.captainplayer) {
      filteredList = filteredList.filter((ml) => ml.teamA.captain?._id === user.info?.captainplayer || ml.teamB.captain?._id === user.info?.captainplayer);
    }

    if (inputElement.value !== "") {
      filteredList = filteredList.filter((m) => inputElement.value === validateMatchDatetime(m.date));
    }

    setFilteredMatchList([...filteredList]);
  };

  return (
    <div className='matchList w-full flex flex-col md:flex-row justify-between gap-1 flex-wrap'>
      <SelectInput handleSelect={handlePeriodChange} name='period' optionList={eventPeriods.map((p) => ({ text: p, value: p }))} lblTxt='Date' rw='w-3/6' />

      {filteredMatchList && filteredMatchList.map((match: IMatchExpRel, i) => <MatchCard setActErr={setActErr}  setIsLoading={setIsLoading} eventId={eventId} key={match._id} match={match} sl={i + 1} refetchFunc={refetchFunc} />)}
    </div>
  );
}

export default MatchList;