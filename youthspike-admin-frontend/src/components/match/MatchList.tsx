import { IPlayer, IMatch, ITeam, IOption } from '@/types';
import React, { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import { divisionsToOptionList } from '@/utils/helper';
import SelectInput from '../elements/forms/SelectInput';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatchDetail extends IMatch {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}



interface IMatchListProps {
  eventId: string;
  matchList?: IMatchDetail[];
  divisions: string;
}

function MatchList({ matchList, divisions, eventId }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (inputEl.value === "") {
      if (matchList) setFilteredMatchList([...matchList]);
    } else {
      const filteredItems = matchList?.filter((m) => m.divisions && m.divisions.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      if (filteredItems) setFilteredMatchList([...filteredItems]);
    }
  }


  useEffect(() => {
    if (matchList && matchList.length > 0) {
      setFilteredMatchList([...matchList]);
    }

    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList)
    }
  }, [matchList, divisions]);
  return (
    <div className='matchList w-full flex flex-col gap-1'>
      <SelectInput handleSelect={handleDivisionChange} name='division' optionList={divisionList} lblTxt='Division' rw='w-3/6' />

      {filteredMatchList.length > 0 && filteredMatchList.map((match: IMatch, i) => <MatchCard eventId={eventId} key={match._id} match={match} sl={i + 1} />)}
    </div>
  )
}

export default MatchList;