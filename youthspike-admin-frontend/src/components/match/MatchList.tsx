import React, { useEffect, useState } from 'react';
import { IPlayer, IMatch, ITeam, IOption } from '@/types';
import { UserRole } from '@/types/user';
import MatchCard from './MatchCard';
import { divisionsToOptionList } from '@/utils/helper';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';
import { EEventPeriod } from '@/types/event';
import { eventPeriods } from '@/utils/staticData';
import { validateMatchDatetime } from '@/utils/datetime';

interface IMatchListProps {
  eventId: string;
  matchList: IMatch[];
  division: string;
  refetchFunc?: ()=> Promise<void>;
}

function MatchList({ matchList, division, eventId, refetchFunc }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([...matchList]);
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

      {filteredMatchList && filteredMatchList.map((match: IMatch, i) => <MatchCard eventId={eventId} key={match._id} match={match} sl={i + 1} refetchFunc={refetchFunc} />)}
    </div>
  );
}

export default MatchList;