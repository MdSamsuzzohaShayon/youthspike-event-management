import { useLdoId } from '@/lib/LdoProvider';
import { ITeamSelectProps } from '@/types';
import Link from 'next/link';
import React from 'react';

function TeamSelectInput(props: ITeamSelectProps) {
    const {ldoIdUrl} = useLdoId();

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, playerId: string) => {
        const isChecked = e.target.checked;
        props.handleCheckboxChange(playerId, isChecked);
    };
    
    
    return (
        <div className={`input-group w-full flex flex-col ${props.extraCls}`}>
            <label htmlFor="players">Select Teams or <Link href={`/${props.eventId}/teams/new/${ldoIdUrl}`} className='underline underline-offset-1' >Create New Team!</Link></label>
            <ul className='flex flex-wrap items-center gap-2'>
                {props.teamList.map((ap) => (
                    <li key={ap._id} className='flex gap-1 items-center'>
                        <input type="checkbox" onChange={(e) => handleCheckboxChange(e, ap._id)} />
                        <span className='capitalize'>{`${ap.name}`}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TeamSelectInput;