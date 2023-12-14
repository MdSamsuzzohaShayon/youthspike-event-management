import { GET_EVENT_WITH_TEAMS } from '@/graphql/teams';
import { useMutation } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import DateInput from '../elements/forms/DateInput';
import { IAddMatch, IDefaultEventMatch, IDefaultMatchProps, IError, IEvent, IOption, ITeam } from '@/types';
import TextInput from '../elements/forms/TextInput';
import NumberInput from '../elements/forms/NumberInput';
import SelectInput from '../elements/forms/SelectInput';
import staticData from '../../lib/data.json';
import ToggleInput from '../elements/forms/ToggleInput';
import { CREATE_MATCH, UPDATE_MATCH } from '@/graphql/matches';

interface IMatchTeams extends IDefaultMatchProps {
    teams: ITeam[]; // add teams to IDefaultEventMatch
}

interface IMatchAddProps {
    update?: boolean;
    eventId: string;
    matchId?: string;
    matchData: IMatchTeams | null;
    setActErr: React.Dispatch<React.SetStateAction<IError>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}


const initialAddMatch = {
    date: new Date(),
    event: "",
    netRange: 5,
    location: "",
    numberOfNets: 0,
    numberOfRounds: 0,
    teamA: "",
    teamB: "",

    // Default settings
    autoAssign: false,
}


function MatchAdd({ matchData, eventId, setActErr, setIsLoading, update, matchId }: IMatchAddProps) {
    const { homeTeamStrategy, assignLogicList, rosterLockList } = staticData;

    const [addMatch, setAddMatch] = useState<IAddMatch>(initialAddMatch);
    const [updateMatch, setUpdateMatch] = useState<Partial<IAddMatch>>({});
    const [createMatch] = useMutation(CREATE_MATCH);
    const [mutateMatch] = useMutation(UPDATE_MATCH)

    /**
     * Input change
     */
    const handleInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleNumInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, [inputEl.name]: parseInt(inputEl.value, 10) }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, [inputEl.name]: parseInt(inputEl.value, 10) }));
        }
    }

    const handleSelectChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLSelectElement;
        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleToggleInput = (e: React.SyntheticEvent, stateName: string) => {
        e.preventDefault();
        // @ts-ignore
        const prevStateVal: boolean = addMatch[stateName] ? addMatch[stateName] : false;
        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
        }
    }

    /**
     * Submit add match
     */
    const handleAddMatch = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            let matchRes = null;
            if (update) {
                const updateMatchObj = { ...updateMatch, event: eventId };
                if (Object.entries(updateMatchObj).length <= 1) return setIsLoading(false); // Do not allow to update empty object
                // @ts-ignore
                if (updateMatchObj.teams) delete updateMatchObj.teams;
                matchRes = await mutateMatch({ variables: { input: updateMatchObj, matchId } });
            } else {
                const addMatchObj = { ...addMatch, event: eventId };
                if (addMatchObj.teamA === '' || addMatchObj.teamB === '') return setActErr({ name: 'Invalid Teams', message: 'Teams can not be empty to unselected!' })
                // @ts-ignore
                if (addMatchObj.teams) delete addMatchObj.teams;
                matchRes = await createMatch({ variables: { input: addMatchObj } });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Show select items list
     */
    const showTeamList = (teamItems: ITeam[] | null | undefined): IOption[] => {
        if (!teamItems) return [];
        const options = [];
        for (let i = 0; i < teamItems.length; i++) {
            options.push({ value: teamItems[i]._id, text: teamItems[i].name });
        }
        return options;
    }

    const showDivisionList = (divs: string | null | undefined): IOption[] => {
        if (!divs) return [];
        const options = [];
        const divList = divs.split(',')
        for (let i = 0; i < divList.length; i++) {
            options.push({ value: divList[i].toLowerCase(), text: divList[i] });
        }
        return options;
    }

    useEffect(() => {        
        if (matchData) {
            setAddMatch((prevState) => ({
                ...prevState,
                ...matchData,
            }));
        }
    }, [matchData]);

    const teams = matchData?.teams;

    return (
        <form onSubmit={handleAddMatch}>
            <DateInput handleInputChange={handleInputChange} name='date' required={!update} defaultValue={addMatch.date} vertical />
            <NumberInput required={!update} lblTxt='Net Range' name='netRange' defaultValue={addMatch.netRange} handleInputChange={handleNumInputChange} vertical />

            {!update && (<>
                <SelectInput name='teamA' optionList={showTeamList(teams)} handleSelect={handleSelectChange} defaultValue={addMatch.teamA} vertical />
                <SelectInput name='teamB' optionList={showTeamList(teams)} handleSelect={handleSelectChange} defaultValue={addMatch.teamB} vertical />
            </>)}

            <h3>Default settings</h3>
            <SelectInput name='divisions' optionList={showDivisionList(addMatch.divisions)} handleSelect={handleSelectChange} defaultValue={addMatch.divisions} vertical />
            <NumberInput required={!update} lblTxt='Number of nets' name='numberOfNets' defaultValue={addMatch.numberOfNets} handleInputChange={handleNumInputChange} vertical />
            <NumberInput required={!update} lblTxt='Number of rounds' name='numberOfRounds' defaultValue={addMatch.numberOfRounds} handleInputChange={handleNumInputChange} vertical />
            <NumberInput required={!update} lblTxt='Net Variance' name='netVariance' defaultValue={addMatch.netVariance} handleInputChange={handleNumInputChange} vertical />
            <SelectInput name='homeTeam' defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} vertical />
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={addMatch.autoAssign}
                name="autoAssign" lw='w-3/6' />
            <SelectInput defaultValue={addMatch.autoAssignLogic} name='autoAssignLogic' optionList={assignLogicList} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <NumberInput required={!update} lblTxt='Timeout' name='timeout' defaultValue={addMatch.timeout} handleInputChange={handleNumInputChange} vertical />
            <TextInput handleInputChange={handleInputChange} lblTxt='Coach Password' name='coachPassword' required={!update} defaultValue={addMatch.coachPassword} vertical />
            <TextInput handleInputChange={handleInputChange} name='location' required={!update} defaultValue={addMatch.location} vertical />
            <button className="btn-secondary mt-4">{update ? 'Update': 'Add'}</button>
        </form>
    )
}

export default MatchAdd;