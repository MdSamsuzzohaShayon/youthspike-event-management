import { IAddMatch, ITeam } from "@/types";
import React, { useState } from "react";
import SelectInput from "../elements/forms/SelectInput";


interface ITeamSelectorProps{
  teamList: ITeam[];
  setAddMatch: React.Dispatch<React.SetStateAction<IAddMatch>>;
}

const TeamSelector = ({teamList, setAddMatch}: ITeamSelectorProps) => {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const handleTeamAChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setTeamA(inputEl.value);
    setAddMatch((prevState)=> ({...prevState, teamA: inputEl.value}));
    if (inputEl.value === teamB) {
      setTeamB("");
    }
  };

  const handleTeamBChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setTeamB(inputEl.value);
    setAddMatch((prevState)=> ({...prevState, teamB: inputEl.value}));
    if (inputEl.value === teamA) {
      setTeamA("");
    }
  };

  const availableTeamsForA = teamList.filter((team) => team._id !== teamB);
  const availableTeamsForB = teamList.filter((team) => team._id !== teamA);

  return (
    <React.Fragment>
       <SelectInput key="ts-si-1" name='teamA' value={teamA} optionList={availableTeamsForA.map((t, i)=>({id: i+1, value: t._id, text: t.name}))} label='Team A' handleSelect={handleTeamAChange} />
       <SelectInput key="ts-si-2" name='teamB' value={teamB} optionList={availableTeamsForB.map((t, i)=>({id: i+1, value: t._id, text: t.name}))} label='Team B' handleSelect={handleTeamBChange} />
      {/* <div className="input-group mt-4 w-full flex flex-col justify-between items-center md:w-5/12">
        <label className="capitalize w-full" htmlFor="teamA">Team A</label>
        <select className="form-control capitalize w-full" id="teamA" value={teamA} onChange={handleTeamAChange}>
          <option className="bg-white text-gray-900 capitalize" value="">Select Team A</option>
          {availableTeamsForA.map((team) => (
            <option className="bg-white text-gray-900 capitalize" key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group mt-4 w-full flex flex-col justify-between items-center md:w-5/12">
        <label htmlFor="teamB" className="capitalize w-full" >Team B</label>
        <select className="form-control capitalize w-full" id="teamB" value={teamB} onChange={handleTeamBChange}>
          <option className="bg-white text-gray-900 capitalize" value="">Select Team B</option>
          {availableTeamsForB.map((team) => (
            <option className="bg-white text-gray-900 capitalize" key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      </div> */}
    </React.Fragment>
  );
};

export default TeamSelector;