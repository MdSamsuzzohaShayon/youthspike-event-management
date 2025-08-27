import { IAddMatch, ITeam } from '@/types';
import React, { useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';

interface ITeamSelectorProps {
  teamList: ITeam[];
  setAddMatch: React.Dispatch<React.SetStateAction<IAddMatch>>;
}

const TeamSelector = ({ teamList, setAddMatch }: ITeamSelectorProps) => {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const handleTeamAChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setTeamA(inputEl.value);
    setAddMatch((prevState) => ({ ...prevState, teamA: inputEl.value }));
    if (inputEl.value === teamB) {
      setTeamB('');
    }
  };

  const handleTeamBChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setTeamB(inputEl.value);
    setAddMatch((prevState) => ({ ...prevState, teamB: inputEl.value }));
    if (inputEl.value === teamA) {
      setTeamA('');
    }
  };

  // const availableTeamsForA = teamList.filter((team) => team._id !== teamB);
  // const availableTeamsForB = teamList.filter((team) => team._id !== teamA);
  const availableTeamsForA = teamList.filter((team) => team._id !== teamB).sort((a, b) => a.name.localeCompare(b.name));
  const availableTeamsForB = teamList.filter((team) => team._id !== teamA).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <React.Fragment>
      <SelectInput
        key="ts-si-1"
        name="teamA"
        value={teamA}
        optionList={availableTeamsForA.map((t, i) => ({ id: i + 1, value: t._id, text: t.name }))}
        label="Team A"
        handleSelect={handleTeamAChange}
      />
      <SelectInput
        key="ts-si-2"
        name="teamB"
        value={teamB}
        optionList={availableTeamsForB.map((t, i) => ({ id: i + 1, value: t._id, text: t.name }))}
        label="Team B"
        handleSelect={handleTeamBChange}
      />
    </React.Fragment>
  );
};

export default TeamSelector;
