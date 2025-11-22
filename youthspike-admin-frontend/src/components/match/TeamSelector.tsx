import { IAddMatch, ITeam } from '@/types';
import React, { useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import TextInput from '../elements/forms/TextInput';
import InputField from '../elements/forms/InputField';

interface ITeamSelectorProps {
  teamList: ITeam[];
  setAddMatch: React.Dispatch<React.SetStateAction<IAddMatch>>;
  handleNumInputChange: (e: React.SyntheticEvent) => void;
}

const TeamSelector = ({ teamList, setAddMatch, handleNumInputChange }: ITeamSelectorProps) => {
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
      <div className="team-a flex flex-col md:flex-row justify-between items-center gap-x-2 gap-y-6">
        <SelectInput
          key="ts-si-1"
          name="teamA"
          value={teamA}
          optionList={availableTeamsForA.map((t, i) => ({ id: i + 1, value: t._id, text: t.name }))}
          label="Team A (Placing first)"
          handleSelect={handleTeamAChange}
          className="w-full"
          // className="w-full md:w-4/6"
        />
        {/* <InputField name="teamAP" label="Round P ponts (Team A)" type="number" className="w-full md:w-2/6" handleInputChange={handleNumInputChange} /> */}
      </div>
      <div className="team-b flex flex-col md:flex-row justify-between items-center gap-x-2 gap-y-6">
        <SelectInput
          key="ts-si-2"
          name="teamB"
          value={teamB}
          optionList={availableTeamsForB.map((t, i) => ({ id: i + 1, value: t._id, text: t.name }))}
          label="Team B"
          handleSelect={handleTeamBChange}
          // className="w-full md:w-4/6"
          className="w-full"
        />
        {/* <InputField name="teamBP" label="Round P ponts (Team B)" type="number" className="w-full md:w-2/6" handleInputChange={handleNumInputChange} /> */}
      </div>
    </React.Fragment>
  );
};

export default TeamSelector;
