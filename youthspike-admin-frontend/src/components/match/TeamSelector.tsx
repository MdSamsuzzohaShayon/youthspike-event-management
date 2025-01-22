import React, { useState } from "react";

const teamList = [
  { _id: "sjwuehwe1", name: "FC Barcelona" },
  { _id: "sjwuehwe2", name: "Real Madrid" },
  { _id: "sjwuehwe3", name: "Manchester United" },
  { _id: "sjwuehwe4", name: "Liverpool" },
];

const TeamSelector = () => {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const handleTeamAChange = (e) => {
    setTeamA(e.target.value);
    if (e.target.value === teamB) {
      setTeamB("");
    }
  };

  const handleTeamBChange = (e) => {
    setTeamB(e.target.value);
    if (e.target.value === teamA) {
      setTeamA("");
    }
  };

  const availableTeamsForA = teamList.filter((team) => team._id !== teamB);
  const availableTeamsForB = teamList.filter((team) => team._id !== teamA);

  return (
    <div>
      <h3>Select Teams</h3>
      <div>
        <label htmlFor="teamA">Team A:</label>
        <select className="text-black" id="teamA" value={teamA} onChange={handleTeamAChange}>
          <option className="text-black" value="">Select Team A</option>
          {availableTeamsForA.map((team) => (
            <option className="text-black" key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="teamB">Team B:</label>
        <select className="text-black" id="teamB" value={teamB} onChange={handleTeamBChange}>
          <option className="text-black" value="">Select Team B</option>
          {availableTeamsForB.map((team) => (
            <option className="text-black" key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4>Selected Teams:</h4>
        <p>Team A: {teamList.find((team) => team._id === teamA)?.name || "None"}</p>
        <p>Team B: {teamList.find((team) => team._id === teamB)?.name || "None"}</p>
      </div>
    </div>
  );
};

export default TeamSelector;
