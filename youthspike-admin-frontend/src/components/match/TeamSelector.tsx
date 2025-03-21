import { IAddMatch, ITeam } from "@/types";
import React, { useMemo, useState } from "react";
import SelectInput from "../elements/forms/SelectInput";


interface ITeamSelectorProps{
  teamList: ITeam[];
  setAddMatch: React.Dispatch<React.SetStateAction<IAddMatch>>;
}

const TeamSelector = ({teamList, setAddMatch}: ITeamSelectorProps) => {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const handleTeamAChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setTeamA(inputEl.value);
    setAddMatch((prevState)=> ({...prevState, teamA: inputEl.value}));
    if (inputEl.value === teamB) {
      setTeamB("");
    }
  };

  const handleTeamBChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    setTeamB(inputEl.value);
    setAddMatch((prevState)=> ({...prevState, teamB: inputEl.value}));
    if (inputEl.value === teamA) {
      setTeamA("");
    }
  };

  const availableTeamsForA = useMemo(()=> {
    const newList = teamList.filter((team) => team._id !== teamB).map((t, tI)=>({id: tI+1, text: t.name, value: t._id}));
    return newList;
  }, [teamList, teamB ]);

  const availableTeamsForB = useMemo(()=> {
    const newList = teamList.filter((team) => team._id !== teamA).map((t, tI)=>({id: tI+1, text: t.name, value: t._id}));
    return newList;
  }, [teamList, teamB ]);


  return (
    <React.Fragment>
      <SelectInput key="ts-si-1" name='teamA' value={teamA} optionList={availableTeamsForA} label='Team A' handleSelect={handleTeamAChange} />

      <SelectInput key="ts-si-1" name='teamB' value={teamA} optionList={availableTeamsForB} label='Team B' handleSelect={handleTeamBChange} />
    </React.Fragment>
  );
};

export default TeamSelector;
