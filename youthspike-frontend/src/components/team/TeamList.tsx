import { IMatchExpRel, IOption, IPlayer, ITeam } from '@/types';
import React, { useEffect, useState } from 'react';
import { divisionsToOptionList } from '@/utils/helper';
import TeamCard from './TeamCard';
import SelectInput from '../elements/SelectInput';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface ITeamListProps {
  divisions: string;
  // eslint-disable-next-line react/require-default-props
  teamList?: ITeamCaptain[];
  // eslint-disable-next-line react/require-default-props
  matchList?: IMatch[];
}

function TeamList({ teamList, matchList, divisions }: ITeamListProps) {
  const [filteredTeamList, setFilteredTeamList] = useState<ITeamCaptain[]>([]);
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

  const renderTeamCardMatches = (team: ITeamCaptain, ml?: IMatch[]) => {
    if (!ml) return;
    const newMatchList: IMatch[] = [];

    for (let i = 0; i < ml.length; i += 1) {
      if (ml[i].teamA._id === team._id || ml[i].teamB._id === team._id) {
        newMatchList.push(ml[i]);
      }
    }

    // eslint-disable-next-line consistent-return
    return <TeamCard team={team} key={team._id} matchList={newMatchList} />;
  };

  return (
    <div className="teamList w-full flex flex-col gap-1">
      <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" rw="w-3/6" />
      {filteredTeamList.map((team) => renderTeamCardMatches(team, matchList))}
    </div>
  );
}

export default TeamList;
