import useClickOutside from '@/hooks/useClickOutside';
import { ITeam } from '@/types';
import { ETeam } from '@/types/team';
import LocalStorageService from '@/utils/LocalStorageService';
import React, { useEffect, useRef } from 'react';

interface ISelectTeamProps {
  teamA: ITeam;
  teamB: ITeam;
  setSelectTeam: React.Dispatch<React.SetStateAction<boolean>>;
}

function SelectTeam({ teamA, teamB, setSelectTeam }: ISelectTeamProps) {
  const dialogTeamEl = useRef<HTMLDialogElement | null>(null);


  useClickOutside(dialogTeamEl, () => {
    setSelectTeam(false); // Show current selected team
    dialogTeamEl.current?.close();
  });

  const handleTeamSelect = async (e: React.SyntheticEvent, selectedTeam: ETeam) => {
    e.preventDefault();
    // Set team to localStorage and reload the page
    // When reload the page make sure to setMyTeam from localStorage if admin or director loggedIn
    const success = await LocalStorageService.setLocalTeam(selectedTeam);
    if (success) {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (dialogTeamEl && dialogTeamEl.current) {
      dialogTeamEl.current.showModal();
    }
  }, []);

  return (
    <dialog ref={dialogTeamEl} className="w-5/6 bg-white text-black-logo">
      <ul className="team-select-strategy">
        <li className="p-2 border-b border-yellow-400 capitalize" role="presentation" onClick={(e) => handleTeamSelect(e, ETeam.teamA)}>
          {teamA.name}
        </li>
        <li className="p-2 border-b border-yellow-400 capitalize" role="presentation" onClick={(e) => handleTeamSelect(e, ETeam.teamB)}>
          {teamB.name}
        </li>
      </ul>
    </dialog>
  );
}

export default SelectTeam;
