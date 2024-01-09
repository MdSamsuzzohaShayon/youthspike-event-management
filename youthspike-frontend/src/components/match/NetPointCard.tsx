import { useUser } from '@/lib/UserProvider';
import { useAppDispatch } from '@/redux/hooks';
import { updateNetScore } from '@/redux/slices/netSlice';
import { INetBase, INetRelatives, ITeam } from '@/types';
import { ETeam } from '@/types/team';
import { UserRole } from '@/types/user';
import React from 'react';


interface INetPointCard {
    teamA: ITeam | null | undefined;
    teamB: ITeam | null | undefined;
    net: INetRelatives | null | undefined;
    handleRightShift: ()=> void;
    handleLeftShift: ()=> void;
}

function NetPointCard({ teamA, teamB, net, handleRightShift, handleLeftShift }: INetPointCard) {
    const user = useUser();
    const dispatch = useAppDispatch();

    const handlePointChange = (e: React.SyntheticEvent, netId: string | undefined, teamAorB: string) => {
        /**
         * Set team a score and team b score for specific net
         */
        e.preventDefault();
        if (!netId) return;

        const inputEl = e.target as HTMLInputElement;
        const teamScore = parseInt(inputEl.value, 10);
        dispatch(updateNetScore({ netId, teamAorB, teamScore }))

    }

    const handleKeyUp = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const inputReadonly = (teamAorB: ITeam | null | undefined) => {
        let mutable = false;

        if (user && (
            user.info?.role === UserRole.admin ||
            user.info?.role === UserRole.director ||
            (user.info?.captainplayer && user.info.captainplayer === teamAorB?.captain?._id)
        )) {
            mutable = true;
        }

        return mutable;
    };


    return (
        <div className={`absolute z-10 h-28 w-11/12 left-2 bg-yellow-500 flex flex-col justify-around items-center 
          ${user && user.info?.captainplayer === teamA?.captain?._id ? "flex-col" : "flex-col-reverse"}`} style={{ top: '39%' }}>
            <div className="score-card-in-net w-3/6">
                <input type="number" defaultValue={net?.teamAScore ? net?.teamAScore : '0'}
                    readOnly={inputReadonly(teamA)}
                    onChange={(e) => handlePointChange(e, net?._id, ETeam.teamA)}
                    className='w-full bg-gray-100 text-gray-900 px-4 py-1 text-center outline-none' />
            </div>
            <div className="net-card flex justify-around w-full">
                <img src="/icons/right-arrow.svg" alt="right-arrow" onKeyUp={handleKeyUp} onClick={handleRightShift} role="presentation" className="w-4 h-4 svg-white" style={{ transform: 'scaleX(-1)' }} />
                <h3>Net {net?.num}</h3>
                <img src="/icons/right-arrow.svg" alt="left-arrow" onKeyUp={handleKeyUp} onClick={handleLeftShift} role="presentation" className="w-4 h-4 svg-white" />
            </div>
            <div className="score-card-in-net w-3/6 bg-gray-100 text-gray-900 text-center px-4 py-1">
                <input type="number" defaultValue={net?.teamBScore ? net?.teamBScore : '0'}
                    className='w-full bg-gray-100 text-gray-900 px-4 py-1 text-center outline-none' readOnly={inputReadonly(teamB)} />
            </div>
        </div>
    )
}

export default NetPointCard