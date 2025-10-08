import { useAppSelector } from '@/redux/hooks';
import { INetRelatives, IRoundRelatives, IUserContext } from '@/types';
import { ETieBreakingStrategy } from '@/types/match';
import { ETieBreaker } from '@/types/net';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import { fsToggle } from '@/utils/helper';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ITeamScoreInputProps {
  net: INetRelatives | null;
  teamE: ETeam;
  screenWidth: number;
  teamName: string;
  user: IUserContext | null;
  currRound: IRoundRelatives | null;
  wTeam: ETeam | null;
  currRoundNets: INetRelatives[];
  handlePointChange: (e: React.SyntheticEvent, netId: string | null, teamAorB: string) => void;
}
function TeamScoreInput({ net, teamE, wTeam, screenWidth, teamName, user, currRound, currRoundNets, handlePointChange }: ITeamScoreInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [defaultVal, setDefaultVal] = useState<string>('');
  const { match: currMatch } = useAppSelector((state) => state.matches);

  const inputReadonly = useMemo((): boolean => {
    const isUserAuthorized = user && (user.info?.role === UserRole.admin || user.info?.role === UserRole.director || user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain);
    // ||
    // || (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)

    let banningNet = false;
    if (currMatch && !currMatch.extendedOvertime && currMatch.tieBreaking === ETieBreakingStrategy.TWO_POINTS_NET) {
      let lockedNet = 0;
      currRoundNets.forEach((crn) => {
        if (crn.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) {
          lockedNet += 1;
        } else if (crn.netType === ETieBreaker.FINAL_ROUND_NET) {
          banningNet = true;
        }
      });
      if (lockedNet >= 2) {
        banningNet = false;
      }
    }

    

    return !isUserAuthorized || currRound?.teamBProcess !== EActionProcess.LINEUP || currRound?.teamAProcess !== EActionProcess.LINEUP || banningNet;
  }, [currMatch, currRound?.teamAProcess, currRound?.teamBProcess, currRoundNets, user]);

  console.log({inputReadonly, "currRound?.teamBProcess !== EActionProcess.LINEUP": currRound?.teamBProcess !== EActionProcess.LINEUP,
     "currRound?.teamAProcess !== EActionProcess.LINEUP": currRound?.teamAProcess !== EActionProcess.LINEUP});
  


  useEffect(() => {
    const TBS = net?.teamBScore?.toString() || '';
    const TAS = net?.teamAScore?.toString() || '';



    setDefaultVal(teamE === ETeam.teamB ? TBS : TAS);
  }, [net, teamE]);

  return (
    <div className="TeamScoreInput w-full text-center">
      <input
        type="number"
        ref={inputRef}
        name={teamName}
        onChange={(e) => handlePointChange(e, net?._id ?? null, teamE)}
        defaultValue={defaultVal}
        style={fsToggle(screenWidth)}
        className={`w-5/6 md:w-2/6 rounded-lg ${wTeam === teamE ? 'bg-green-500 text-gray-100' : 'bg-white text-black-logo'}  p-1 text-center outline-none`}
        readOnly={inputReadonly}
      />
    </div>
  );
}

export default TeamScoreInput;