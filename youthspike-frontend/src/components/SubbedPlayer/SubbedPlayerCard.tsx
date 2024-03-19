import { IPlayer } from '@/types';
import React, { useState } from 'react';

interface ISubbedPlayerCardProps {
    player: IPlayer;
    subControl?: boolean;
}

function SubbedPlayerCard({ player, subControl }: ISubbedPlayerCardProps) {

    const [showAction, setShowAction] = useState<boolean>(false);

    const handleRemovePlayer=(e: React.SyntheticEvent)=>{
        e.preventDefault();
    }
    return (
        <div className="small-player-card border-light p-1 flex items-center gap-x-1 relative">
            <h4 className='capitalize'>{player.rank + ". " + player.firstName + " " + player.lastName}</h4>
            {subControl && <img className='w-4' src='/icons/dots-vertical.svg' role='presentation' onClick={(e)=> setShowAction(!showAction)} /> }
            
            {showAction && subControl && (
                <ul className="absolute actionBox bg-gray-900 text-gray-100 p-2 right-3">
                    <li role="presentation" onClick={handleRemovePlayer} >Remove</li>
                </ul>
            )}
        </div>
    )
}

export default SubbedPlayerCard;