"use client";

import { useState } from "react";

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [currDivision, setCurrDivision] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  // Sample team data
  const teams = [
    { id: "1", name: "Barcelona FC", division: "d1", group: "G-1", abbreviation: "BF" },
    { id: "2", name: "Paris Saint-Germain FC", division: "d1", group: "G-1", abbreviation: "PSF" },
    { id: "3", name: "Liverpool FC", division: "d2", group: "G-2", abbreviation: "LF" },
    { id: "4", name: "Manchester United", division: "d1", group: "G-1", abbreviation: "MU" },
    { id: "5", name: "Real Madrid", division: "d3", group: "G-3", abbreviation: "RM" },
  ];

  const divisions = [
    { value: "", label: "All" },
    { value: "d1", label: "d1" },
    { value: "d2", label: "d2" },
    { value: "d3", label: "d3" },
  ];

  const groups = [
    { id: "68caef95484a188ab66cec21", name: "G-1", division: "d1" },
    { id: "68caef95484a188ab66cec22", name: "G-2", division: "d2" },
    { id: "68caef95484a188ab66cec23", name: "G-3", division: "d3" },
  ];

  const filteredTeams = teams.filter(team => {
    const matchesSearch = !search || team.name.toLowerCase().includes(search.toLowerCase());
    const matchesDivision = !currDivision || team.division === currDivision;
    const matchesGroup = !selectedGroup || team.group === selectedGroup;
    return matchesSearch && matchesDivision && matchesGroup;
  });

  const filteredGroups = groups.filter(group => 
    !currDivision || group.division === currDivision
  );

  return (
    <div className="animate-fade-in">
      {/* Filters Section */}
      <div className="w-full bg-gray-800 p-3 rounded-md mb-4 animate-slide-down">
        <div className="w-full">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="division" className="text-xs font-medium text-gray-300 capitalize">
                Division
              </label>
              <select
                name="division"
                id="division"
                value={currDivision}
                onChange={(e) => {
                  setCurrDivision(e.target.value);
                  setSelectedGroup("");
                }}
                className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white transition-all duration-300"
              >
                {divisions.map(div => (
                  <option key={div.value} value={div.value} className="capitalize bg-gray-800 text-white">
                    {div.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="group" className="text-xs font-medium text-gray-300 capitalize">
                Group
              </label>
              <select
                name="group"
                id="group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white transition-all duration-300"
              >
                <option value="" className="bg-gray-600 text-gray-300">All</option>
                {filteredGroups.map(group => (
                  <option key={group.id} value={group.id} className="capitalize bg-gray-800 text-white">
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative mt-2">
            <input
              id="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-all duration-300"
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team, index) => (
          <div
            key={team.id}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-black bg-yellow-400 flex justify-center items-center w-12 h-12 object-contain rounded-xl">
                <p className="uppercase font-bold">{team.abbreviation}</p>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold capitalize">{team.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded capitalize">{team.division}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{team.group}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-8 text-gray-400 animate-fade-in">
          No teams found matching your criteria.
        </div>
      )}
    </div>
  );
}