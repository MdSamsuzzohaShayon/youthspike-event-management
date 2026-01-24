import { EPlayerStatus, IAddMatch, ITeam } from '@/types';
import React, { useMemo, useState } from 'react';
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


  const processedTeams = useMemo(() => {
    return teamList
      .map((team) => {
        let activeCount = 0;

        for (const player of team.players ?? []) {
          if (player.status === EPlayerStatus.ACTIVE) activeCount++;
        }

        return {
          ...team,
          totalPlayers: team.players?.length ?? 0,
          activePlayers: activeCount
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamList]);

  const availableTeamsForA = useMemo(() => {
    return processedTeams.filter((team) => team._id !== teamB);
  }, [processedTeams, teamB]);

  const availableTeamsForB = useMemo(() => {
    return processedTeams.filter((team) => team._id !== teamA);
  }, [processedTeams, teamA]);


  return (
    <React.Fragment>
      <div className="team-a flex flex-col md:flex-row justify-between items-center gap-x-2 gap-y-6">
        <SelectInput
          key="ts-si-1"
          name="teamA"
          value={teamA}
          optionList={availableTeamsForA.map((t, i) => ({ id: i + 1, value: t._id, text: `${t.name} - ${t.activePlayers}/${t.totalPlayers} Players` }))}
          label="Team A (Placing first)"
          handleSelect={handleTeamAChange}
          className="w-full"
        />
      </div>
      <div className="team-b flex flex-col md:flex-row justify-between items-center gap-x-2 gap-y-6">
        <SelectInput
          key="ts-si-2"
          name="teamB"
          value={teamB}
          optionList={availableTeamsForB.map((t, i) => ({ id: i + 1, value: t._id, text: `${t.name} - ${t.activePlayers}/${t.totalPlayers} Players` }))}
          label="Team B"
          handleSelect={handleTeamBChange}
          className="w-full"
        />
      </div>
    </React.Fragment>
  );
};

export default TeamSelector;
