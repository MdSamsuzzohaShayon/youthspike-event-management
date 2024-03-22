import { UPDATE_ROUND } from '@/graphql/round';
import { useAppDispatch } from '@/redux/hooks';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IPlayer, IRoundRelatives } from '@/types';
import { useMutation } from '@apollo/client';
import React, { useState } from 'react';

interface ISubbedPlayerCardProps {
    player: IPlayer;
    currRound: IRoundRelatives | null;
    roundList: IRoundRelatives[];
    subControl?: boolean;
}

function SubbedPlayerCard({ player, currRound, roundList, subControl }: ISubbedPlayerCardProps) {

    const dispatch = useAppDispatch();

    const [showAction, setShowAction] = useState<boolean>(false);

    // ===== GraphQL =====
    const [mutateRound, { loading }] = useMutation(UPDATE_ROUND);

    const handleRemovePlayer = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!currRound) return;
        try {
            const roundObj = { ...currRound };
            const subPlayerIds: string[] = [...roundObj.subs.filter((s) => s !== player._id)];
            roundObj.subs = subPlayerIds;
            const newRoundList = [];
            await mutateRound({ variables: { updateInput: { subs: subPlayerIds } } });
            for (let rIdx = 0; rIdx < roundList.length; rIdx++) {
                const roundObjUpdate = { ...roundList[rIdx] };
                if (roundList[rIdx].num >= roundObj.num) {
                    roundObjUpdate.subs = subPlayerIds;
                }
                newRoundList.push(roundObjUpdate);
            }
            dispatch(setRoundList(newRoundList));
            dispatch(setCurrentRound(roundObj));
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <div className="small-player-card border-light p-1 flex items-center gap-x-1 relative">
            <h4 className='capitalize'>{player.rank + ". " + player.firstName + " " + player.lastName}</h4>
            {subControl && <img className='w-4 svg-white' src='/icons/dots-vertical.svg' role='presentation' onClick={(e) => setShowAction(!showAction)} />}

            {showAction && subControl && (
                <ul className="absolute actionBox bg-gray-900 text-gray-100 p-2 right-3">
                    <li role="presentation" onClick={handleRemovePlayer} >Remove</li>
                </ul>
            )}
        </div>
    )
}

export default SubbedPlayerCard;