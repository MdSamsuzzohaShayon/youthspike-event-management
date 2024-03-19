import { INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import SubbedPlayerCard from './SubbedPlayerCard';

interface ISubbedPlayerProps {
    teamPlayers: IPlayer[];
    subControl?: boolean;
}

function SubbedPlayerList({ teamPlayers, subControl }: ISubbedPlayerProps) {


    return (
        <div className='subbed w-full players-wrapper'>
            <h2>Subbed Players</h2>
            <div className="subbed-player-list w-full flex flex-wrap justify-start gap-2">
                {teamPlayers.map((p) => (
                    <SubbedPlayerCard player={p} key={p._id} subControl={subControl} />
                ))}
            </div>
        </div >
    )
}

export default SubbedPlayerList;