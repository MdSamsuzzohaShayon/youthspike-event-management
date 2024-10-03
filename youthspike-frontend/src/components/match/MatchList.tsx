import { IMatchExpRel, IPlayer, ITeam, IOption } from '@/types';
import React, { useEffect, useState } from 'react';
import { divisionsToOptionList } from '@/utils/helper';
import MatchCard from './MatchCard';
import SelectInput from '../elements/SelectInput';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface IMatchListProps {
  divisions: string;
  // eslint-disable-next-line react/require-default-props
  matchList?: IMatch[];
}



function MatchList({ matchList, divisions }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (inputEl.value === '') {
      if (matchList) setFilteredMatchList([...matchList]);
    } else {
      const filteredItems = matchList?.filter((m) => m.division && m.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      if (filteredItems) setFilteredMatchList([...filteredItems]);
    }
  };

  useEffect(() => {
    if (matchList && matchList.length > 0) {
      setFilteredMatchList([...matchList]);
    }

    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList);
    }
  }, [matchList, divisions]);

  return (
    <div className="matchList w-full flex flex-col gap-1">
      <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" rw="w-3/6" />

      {filteredMatchList.map((match) => (
        <MatchCard match={match} key={match._id} />
      ))}
    </div>
  );
}

export default MatchList;
