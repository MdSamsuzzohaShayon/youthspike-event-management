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
  wTeam: ETeam | null;
  // eslint-disable-next-line no-unused-vars
  handlePointChange: (e: React.SyntheticEvent, netId: string | null, teamAorB: string) => void;
}
function TeamScoreInput({ net, teamE, wTeam , screenWidth, teamName, user, currRound, handlePointChange }: ITeamScoreInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [defaultVal, setDefaultVal] = useState<string>('');

  const inputReadonly = (): boolean => {
    const isUserAuthorized = user && (user.info?.role === UserRole.admin || user.info?.role === UserRole.director || user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain);
    // ||
    // || (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)

    return !isUserAuthorized || currRound?.teamBProcess !== EActionProcess.LINEUP || currRound?.teamAProcess !== EActionProcess.LINEUP;
  };

  useEffect(() => {
    const TBS = net?.teamBScore?.toString() || '';
    const TAS = net?.teamAScore?.toString() || '';

    setDefaultVal(teamE === ETeam.teamB ? TBS : TAS);
  }, [net]);

  return (
    <div className="TeamScoreInput w-full text-center">
      <input
        type="number"
        ref={inputRef}
        name={teamName}
        onChange={(e) => handlePointChange(e, net?._id ?? null, teamE)}
        defaultValue={defaultVal}
        style={fsToggle(screenWidth)}
        className={`w-2/6 rounded-lg ${wTeam === teamE ? 'bg-green-500 text-gray-100' : 'bg-white text-black-logo'}  p-1 text-center outline-none`}
        readOnly={inputReadonly()}
      />
    </div>
  );
}

export default TeamScoreInput;
