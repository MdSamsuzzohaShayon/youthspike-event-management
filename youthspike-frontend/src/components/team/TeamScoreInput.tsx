import { INetRelatives, IRoundRelatives, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import { screen } from '@/utils/constant';
import { fsToggle } from '@/utils/helper';
import React, { useEffect, useRef, useState } from 'react';

interface ITeamScoreInputProps {
  net: INetRelatives | null;
  teamE: ETeam;
  screenWidth: number;
  teamName: string;
  user: IUserContext | null;
  currRound: IRoundRelatives | null;
  // eslint-disable-next-line no-unused-vars
  handlePointChange: (e: React.SyntheticEvent, netId: string | null, teamAorB: string) => void;
}
function TeamScoreInput({ net, teamE, screenWidth, teamName, user, currRound, handlePointChange }: ITeamScoreInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [defaultVal, setDefaultVal] = useState<string>('');

  const inputReadonly = (): boolean => {
    const isUserAuthorized = user && (user.info?.role === UserRole.admin || user.info?.role === UserRole.director || user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain);
    // ||
    // || (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)

    return !isUserAuthorized || currRound?.teamBProcess !== EActionProcess.LINEUP || currRound?.teamAProcess !== EActionProcess.LINEUP;
  };

  useEffect(() => {
    setDefaultVal(teamE === ETeam.teamB ? net?.teamBScore?.toString() || '' : net?.teamAScore?.toString() || '');
  }, [net]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // Check if the input element reference exists
    if (inputRef.current && screenWidth <= screen.xs) {
      // Add focus event listener to the input element

      const handleFocus = () => {
        if (inputRef.current) {
          // Temporarily change the input type to 'text' to enable text selection
          inputRef.current.type = 'text';
          inputRef.current.setSelectionRange(0, inputRef.current.value.length);

          // Set a timeout to revert the input type back to 'number'
          setTimeout(() => {
            if (inputRef.current && screenWidth <= screen.xs) inputRef.current.type = 'number';
          }, 0);
        }
      };

      // Attach the focus event listener
      inputRef.current.addEventListener('focus', handleFocus);

      // Clean up by removing the event listener on component unmount
      return () => {
        if (inputRef.current) inputRef.current.removeEventListener('focus', handleFocus);
      };
    }
  }, []); // Run this effect once on component mount

  return (
    <div className="score-card-in-net w-full text-center">
      <input
        type="number"
        ref={inputRef}
        name={teamName}
        onChange={(e) => handlePointChange(e, net?._id ?? null, teamE)}
        defaultValue={defaultVal}
        style={fsToggle(screenWidth)}
        className="w-4/6 bg-gray-100 text-gray-900 p-1 text-center outline-none"
        readOnly={inputReadonly()}
      />
    </div>
  );
}

export default TeamScoreInput;
