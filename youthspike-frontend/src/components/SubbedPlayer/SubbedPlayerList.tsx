import { INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import SubbedPlayerCard from './SubbedPlayerCard';

interface ISubbedPlayerProps {
    teamPlayers: IPlayer[];
    currRound: IRoundRelatives | null;
    subControl?: boolean;
}

function SubbedPlayerList({ teamPlayers, currRound, subControl }: ISubbedPlayerProps) {
    const [subbedPlayers, setSubbedPlayers] = useState<IPlayer[]>([]);    

    useEffect(() => {
        if (currRound && teamPlayers) {
            const nsp = []; // new subbed players
            for (let i = 0; i < currRound.subs.length; i++) {
                const playerExist = teamPlayers.find((p) => currRound.subs && p._id === currRound.subs[i]);
                if (playerExist) {
                    nsp.push(playerExist);
                }
            }
            setSubbedPlayers(nsp);
        }
    }, [currRound, teamPlayers]);

    return (
        <div className='subbed w-full players-wrapper'>
            <h2>Subbed Players</h2>
            <div className="subbed-player-list w-full flex flex-wrap justify-start gap-2">
                {subbedPlayers.map((p) => (
                    <SubbedPlayerCard player={p} key={p._id} subControl={subControl} />
                ))}
            </div>
        </div >
    )
}

export default SubbedPlayerList;