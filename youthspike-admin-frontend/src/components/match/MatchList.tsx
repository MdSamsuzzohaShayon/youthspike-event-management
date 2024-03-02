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
  matchList?: IMatch[];
  divisions: string;
}

interface IFilterProps {
  division: null | string;
  period: null | EEventPeriod;
}

function MatchList({ matchList, divisions, eventId }: IMatchListProps) {
  const [filterProps, setFilterProps] = useState<IFilterProps>({ division: null, period: null });
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const user = useUser();

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputElement = e.target as HTMLSelectElement;
    let filteredList = [...matchList];

    if (user.info?.captainplayer) {
      filteredList = filteredList.filter((ml) => ml.teamA.captain?._id === user.info?.captainplayer || ml.teamB.captain?._id === user.info?.captainplayer);
    }

    if (filterProps.period) {
      filteredList = filteredList.filter((m) => filterProps.period === validateMatchDatetime(m.date));
    }

    if (inputElement.value !== "") {
      filteredList = filteredList.filter((m) => m.divisions && m.divisions.trim().toLowerCase() === inputElement.value.trim().toLowerCase());
    }

    setFilteredMatchList([...filteredList]);
    setFilterProps((prevProps) => ({ ...prevProps, division: inputElement.value.trim().toLowerCase() }));
  };

  const handlePeriodChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputElement = e.target as HTMLSelectElement;
    let filteredList = [...matchList];

    if (user.info?.captainplayer) {
      filteredList = filteredList.filter((ml) => ml.teamA.captain?._id === user.info?.captainplayer || ml.teamB.captain?._id === user.info?.captainplayer);
    }

    if (filterProps.division) {
      filteredList = filteredList.filter((m) => m.divisions && m.divisions.trim().toLowerCase() === filterProps.division);
    }

    if (inputElement.value !== "") {
      filteredList = filteredList.filter((m) => inputElement.value === validateMatchDatetime(m.date));
    }

    setFilteredMatchList([...filteredList]);
    // @ts-ignore
    setFilterProps((prevProps) => ({ ...prevProps, period: inputElement.value }));
  };

  useEffect(() => {
    if (matchList && matchList.length > 0) {
      const isCaptain = user.info?.captainplayer;
      const filteredList = isCaptain ? matchList.filter((ml) => ml.teamA?.captain?._id === user.info?.captainplayer || ml.teamB?.captain?._id === user.info?.captainplayer) : matchList;
      setFilteredMatchList([...filteredList]);
    }

    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList);
    }
  }, [matchList, divisions]);

  return (
    <div className='matchList w-full flex flex-col md:flex-row justify-between gap-1 flex-wrap'>
      <div className="filters w-full mb-4 flex justify-between items-center gap-x-1">
        {user?.info?.role !== UserRole.captain && <SelectInput handleSelect={handleDivisionChange} name='division' optionList={divisionList} lblTxt='Division' vertical />}
        <SelectInput handleSelect={handlePeriodChange} name='period' optionList={eventPeriods.map((p) => ({ text: p, value: p }))} lblTxt='Date' vertical />
      </div>

      {filteredMatchList.length > 0 && filteredMatchList.map((match: IMatch, i) => <MatchCard eventId={eventId} key={match._id} match={match} sl={i + 1} />)}
    </div>
  );
}

export default MatchList;