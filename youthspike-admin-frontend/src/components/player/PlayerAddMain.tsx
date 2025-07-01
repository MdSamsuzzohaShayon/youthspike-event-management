'use client';

import Loader from '@/components/elements/Loader';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import PlayerAdd from '@/components/player/PlayerAdd';
import { IEventExpRel, ITeam } from '@/types';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { getDivisionFromStore } from '@/utils/localStorage';
import React, { useEffect, useMemo, useState } from 'react';

interface IPlayerAddMainProps {
  teams: ITeam[];
  divisions: string;
  event: IEventExpRel;
}

function PlayerAddMain({ teams, divisions, event }: IPlayerAddMainProps) {
  // ===== Local State =====
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // ===== Filter Players =====
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
  };

  useEffect(() => {
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
    }
  }, []);

  const filteredTeams = useMemo(() => {
    if (currDivision) {
      return teams.filter((t) => t.division.trim().toUpperCase() === currDivision.trim().toUpperCase());
    }
    return teams;
  }, [teams, currDivision]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <h1 className="mb-8 text-center">Add Player</h1>
      {event && <CurrentEvent currEvent={event} />}

      <div className="mb-4 division-selection w-full">
        <SelectInput key="player-new-pg-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionsToOptionList(divisions)} />
      </div>
      <PlayerAdd eventId={event._id} teamList={filteredTeams} division={currDivision} />
    </React.Fragment>
  );
}

export default PlayerAddMain;
