import { IMatchExpRel, IPlayer, IMatchRelatives, ITeam, IOption } from '@/types';
import React, { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import { divisionsToOptionList } from '@/utils/helper';
import SelectInput from '../elements/SelectInput';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}



interface IMatchListProps {
  matchList?: IMatch[];
  divisions: string;
}

function MatchList({ matchList, divisions }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (inputEl.value === "") {
      if (matchList) setFilteredMatchList([...matchList]);
    } else {
      const filteredItems = matchList?.filter((m) => m.division && m.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
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


      {filteredMatchList.map((match, i) => (<MatchCard match={match} key={i} />))}
    </div>
  )
}

export default MatchList;