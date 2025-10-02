"use client";

import { useState } from "react";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [currDivision, setCurrDivision] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  // Sample player data
  const players = [
    { id: "1", firstName: "John", lastName: "Doe", division: "d1", team: "Barcelona FC", number: 10 },
    { id: "2", firstName: "Jane", lastName: "Smith", division: "d1", team: "Paris Saint-Germain FC", number: 7 },
    { id: "3", firstName: "Mike", lastName: "Johnson", division: "d2", team: "Liverpool FC", number: 9 },
    { id: "4", firstName: "Sarah", lastName: "Williams", division: "d1", team: "Barcelona FC", number: 5 },
    { id: "5", firstName: "Chris", lastName: "Brown", division: "d3", team: "Real Madrid", number: 11 },
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

  const filteredPlayers = players.filter(player => {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const matchesSearch = !search || fullName.includes(search.toLowerCase());
    const matchesDivision = !currDivision || player.division === currDivision;
    return matchesSearch && matchesDivision;
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

      {/* Players Grid */}
      <div className="grid gap-3">
        {filteredPlayers.map((player, index) => (
          <div
            key={player.id}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-300 transform hover:scale-102 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {player.firstName[0]}{player.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {player.firstName} {player.lastName}
                  </h3>
                  <p className="text-gray-300 text-sm">{player.team} • #{player.number}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-gray-600 px-2 py-1 rounded capitalize">{player.division}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-400 animate-fade-in">
          No players found matching your criteria.
        </div>
      )}
    </div>
  );
}