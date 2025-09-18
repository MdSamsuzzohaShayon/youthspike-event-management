'use client';

import Loader from '@/components/elements/Loader';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import PlayerAdd from '@/components/player/PlayerAdd';
import { IEventExpRel, ITeam } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import sessionStorageService from '@/utils/SessionStorageService';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { DIVISION } from '@/utils/constant';

interface IPlayerAddMainProps {
  teams: ITeam[];
  divisions: string;
  event: IEventExpRel;
}

function PlayerAddMain({ teams, divisions, event }: IPlayerAddMainProps) {
  // ===== Local State =====
  const [isLoading, setIsLoading] = useState(false);
  const [currDivision, setCurrDivision] = useState('');

  // ===== Load division from sessionStorage only once =====
  useEffect(() => {
    const savedDivision = sessionStorageService.getItem(DIVISION);
    if (savedDivision) setCurrDivision(String(savedDivision));
  }, []);

  // ===== Memoize divisions list to avoid recalculating on every render =====
  const divisionOptions = useMemo(() => divisionsToOptionList(divisions), [divisions]);

  // ===== Memoize filtered teams for performance =====
  const filteredTeams = useMemo(() => {
    if (!currDivision) return teams;
    const normalizedDivision = currDivision.trim().toUpperCase();
    return teams.filter((t) => t.division.trim().toUpperCase() === normalizedDivision);
  }, [teams, currDivision]);

  // ===== Callback avoids unnecessary re-renders of child components =====
  const handleDivisionSelection = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLSelectElement;
      setCurrDivision(inputEl.value.trim());
    },
    []
  );

  if (isLoading) return <Loader />;

  return (
    <>
      <h1 className="mb-8 text-center">Add Player</h1>

      {event && <CurrentEvent currEvent={event} />}

      <div className="mb-4 division-selection w-full">
        <SelectInput
          key="player-new-pg-1"
          handleSelect={handleDivisionSelection}
          value={currDivision}
          name="division"
          optionList={divisionOptions}
        />
      </div>

      <PlayerAdd eventId={event._id} teamList={filteredTeams} division={currDivision} />
    </>
  );
}

export default React.memo(PlayerAddMain);
