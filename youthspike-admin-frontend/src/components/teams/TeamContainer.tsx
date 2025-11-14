'use client'

import React, { useMemo, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import TeamAdd from './TeamAdd';
import { IGroup, IOption, IPlayer, ITeam } from '@/types';
import Loader from '../elements/Loader';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';

interface ITeamContainerProps{
    eventId: string;
    divisionList: IOption[];
    players: IPlayer[];
    groups: IGroup[];
}

function TeamContainer({ eventId, divisionList, players, groups }: ITeamContainerProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currDivision, setCurrDivision] = useState<string>('');

    const handleClose = (e: React.SyntheticEvent) => {
        e.preventDefault();
    }


    const handleDivisionSelection = (e: React.SyntheticEvent) => {
        e.preventDefault();

        const inputEl = e.target as HTMLInputElement;
        setCurrDivision(inputEl.value.trim());
        if (inputEl.value === '') {
            SessionStorageService.removeItem(DIVISION);
            
        } else {
            SessionStorageService.setItem(DIVISION, inputEl.value.trim());
        }
    }


    const filteredPlayers = useMemo(() => {
        if(!currDivision) return players;
        return players.filter((t) => t.division && t.division.trim().toLowerCase() === currDivision.trim().trim().toLowerCase());
    }, [currDivision, players]);


    const filteredGroupList = useMemo(()=>{
        if(!currDivision) return groups;
        return groups.filter((g) => g.division.toLowerCase() === currDivision.trim().toLowerCase());
    }, [currDivision, groups]);

    if(isLoading) return <Loader />

    

    return (
        <div>
            <div className="mt-2 division-selection w-full">
                <SelectInput key="teams-new-pg-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name='division' optionList={divisionList} />
            </div>
            <TeamAdd groupList={filteredGroupList} setIsLoading={setIsLoading} players={filteredPlayers} handleClose={handleClose}
                eventId={eventId} currDivision={currDivision} />
        </div>
    )
}

export default TeamContainer;