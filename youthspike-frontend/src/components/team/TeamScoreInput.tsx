import { INetRelatives, IRoundRelatives, IUser, IUserContext } from '@/types'
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import { fsToggle } from '@/utils/helper';
import React, { useEffect, useState } from 'react'

interface ITeamScoreInputProps {
    net?: INetRelatives | null;
    teamE: ETeam;
    screenWidth: number;
    user: IUserContext | null;
    currRound: IRoundRelatives | null;
    handlePointChange: (e: React.SyntheticEvent, netId: string | undefined, teamAorB: string) => void;
}
function TeamScoreInput({ net, teamE, screenWidth, user, currRound, handlePointChange }: ITeamScoreInputProps) {
    const [defaultVal, setDefaultVal] = useState<string>('');

    const inputReadonly = (): boolean => {
        const isUserAuthorized = user && (
            user.info?.role === UserRole.admin ||
            user.info?.role === UserRole.director ||
            user.info?.role === UserRole.captain ||
            user.info?.role === UserRole.co_captain
            // || 
            // || (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)
        );


        return !isUserAuthorized || (currRound?.teamBProcess !== EActionProcess.LINEUP || currRound?.teamAProcess !== EActionProcess.LINEUP);
    };

    useEffect(() => {
        setDefaultVal(teamE === ETeam.teamB ? (net?.teamBScore?.toString() || '') : (net?.teamAScore?.toString() || ''));        
    }, [net])

    return (<div className="score-card-in-net w-full text-center">
        <input type="number" name='teamBScore'
            onChange={(e) => handlePointChange(e, net?._id, teamE)}
            defaultValue={defaultVal}
            style={fsToggle(screenWidth)}
            className='w-4/6 bg-gray-100 text-gray-900 p-1 text-center outline-none' readOnly={inputReadonly()} />
    </div>)
}

export default TeamScoreInput