import { INetRelatives, IRoundRelatives, IUserContext } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
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



  return (
    <div className="score-card-in-net w-full text-center">
      <input
        type="number"
        ref={inputRef}
        name={teamName}
        onChange={(e) => handlePointChange(e, net?._id ?? null, teamE)}
        defaultValue={defaultVal}
        style={fsToggle(screenWidth)}
        className="w-4/6 bg-white text-gray-900 p-1 text-center outline-none"
        readOnly={inputReadonly()}
      />
    </div>
  );
}

export default TeamScoreInput;
