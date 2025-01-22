import { IAddMatch, ITeam } from "@/types";
import React, { useState } from "react";


interface ITeamSelectorProps{
  teamList: ITeam[];
  setAddMatch: React.Dispatch<React.SetStateAction<IAddMatch>>;
}

const TeamSelector = ({teamList, setAddMatch}: ITeamSelectorProps) => {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const handleTeamAChange = (e) => {
    setTeamA(e.target.value);
    setAddMatch((prevState)=> ({...prevState, teamA: e.target.value}));
    if (e.target.value === teamB) {
      setTeamB("");
    }
  };

  const handleTeamBChange = (e) => {
    setTeamB(e.target.value);
    setAddMatch((prevState)=> ({...prevState, teamB: e.target.value}));
    if (e.target.value === teamA) {
      setTeamA("");
    }
  };

  const availableTeamsForA = teamList.filter((team) => team._id !== teamB);
  const availableTeamsForB = teamList.filter((team) => team._id !== teamA);

  return (
    <div className="w-full flex flex-col md:flex-row justify-between">
      <div className="input-group mt-4 w-full flex flex-col justify-between items-center md:w-5/12">
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
      </div>
    </div>
  );
};

export default TeamSelector;
