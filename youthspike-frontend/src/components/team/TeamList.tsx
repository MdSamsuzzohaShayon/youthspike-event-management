import { IOption, IPlayer, ITeam } from '@/types';
import React, { useEffect, useState } from 'react';
import { divisionsToOptionList } from '@/utils/helper';
import TeamCard from './TeamCard';
import SelectInput from '../elements/SelectInput';

interface IteamCaptain extends ITeam {
  captain: IPlayer;
}

interface ITeamListProps {
  divisions: string;
  teamList?: IteamCaptain[];
}

function TeamList({ teamList, divisions }: ITeamListProps) {
  const [filteredTeamList, setFilteredTeamList] = useState<IteamCaptain[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (inputEl.value === '') {
      if (teamList) setFilteredTeamList([...teamList]);
    } else {
      const filteredItems = teamList?.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      if (filteredItems) setFilteredTeamList([...filteredItems]);
    }
  };

  useEffect(() => {
    if (teamList && teamList.length > 0) {
      setFilteredTeamList([...teamList]);
    }

    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList);
    }
  }, [teamList, divisions]);

  
  return (
    <div className="teamList w-full flex flex-col gap-1">
      <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" rw="w-3/6" />
      {filteredTeamList.map((team) => (
        <TeamCard team={team} key={team._id} />
      ))}
    </div>
  );
}

export default TeamList;
