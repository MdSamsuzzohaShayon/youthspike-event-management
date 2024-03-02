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
import { CREATE_MATCH, GET_EVENT_WITH_MATCHES_TEAMS, UPDATE_MATCH } from '@/graphql/matches';
import { divisionsToOptionList } from '@/utils/helper';
import { assignStrategies } from '@/utils/staticData';
import { EAssignStrategies } from '@/types/elements';

interface IMatchTeams extends IDefaultMatchProps {
    teams: ITeam[]; // add teams to IDefaultEventMatch
}

interface IMatchAddProps {
    update?: boolean;
    eventId: string;
    matchId?: string;
    matchData: IMatchTeams | null;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
}


const initialAddMatch = {
    date: new Date().toISOString(),
    event: "",
    location: "",
    numberOfNets: 0,
    numberOfRounds: 0,
    teamA: "",
    teamB: "",
    autoAssignLogic: EAssignStrategies.AUTO,
    // Default settings
    autoAssign: false,
}


function MatchAdd({ matchData, eventId, setActErr, setIsLoading, update, matchId, showAddMatch }: IMatchAddProps) {
    const { homeTeamStrategy, assignLogicList, rosterLockList } = staticData;

    // Local State
    const [addMatch, setAddMatch] = useState<IAddMatch>(initialAddMatch);
    const [updateMatch, setUpdateMatch] = useState<Partial<IAddMatch>>({});
    const [availableTeams, setAvailableTeams] = useState<ITeam[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<ITeam[]>([]);
    const [divisions, setDivisions] = useState<IOption[]>([]);

    // GraphQL
    const [createMatch, { client }] = useMutation(CREATE_MATCH);
    const [mutateMatch, { client: updateClient }] = useMutation(UPDATE_MATCH)

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

    const handleDivisionChange = (e: React.SyntheticEvent) => {
        handleSelectChange(e);
        const inputEl = e.target as HTMLSelectElement;
        // Just for filtering teams 
        const newList = availableTeams.filter((at)=> at.division && at.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
        setFilteredTeams([...newList]);
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
                if (updateMatchObj.date) {
                    updateMatchObj.date = new Date(updateMatchObj.date).toISOString();
                }
                if (Object.entries(updateMatchObj).length <= 1) return setIsLoading(false); // Do not allow to update empty object
                // @ts-ignore
                if (updateMatchObj.teams) delete updateMatchObj.teams;
                matchRes = await mutateMatch({ variables: { input: updateMatchObj, matchId } });
                await updateClient.refetchQueries({ include: [GET_EVENT_WITH_MATCHES_TEAMS] });
            } else {
                const addMatchObj = { ...addMatch, event: eventId };
                addMatchObj.date = new Date(addMatchObj.date).toISOString();
                if (addMatchObj.teamA === '' || addMatchObj.teamB === '') return setActErr({ name: 'Invalid Teams', message: 'Teams can not be empty to unselected!' })
                if (addMatchObj.teamA === addMatchObj.teamB) return setActErr({ name: 'Invalid Teams', message: 'Both teams are same!' })
                // @ts-ignore
                if (addMatchObj.teams) delete addMatchObj.teams;
                matchRes = await createMatch({ variables: { input: addMatchObj } });
                await client.refetchQueries({ include: [GET_EVENT_WITH_MATCHES_TEAMS] });
            }
            if (showAddMatch) showAddMatch(false);
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


    useEffect(() => {
        if (matchData) {
            setAddMatch((prevState) => ({
                ...prevState,
                ...matchData,
            }));

            setAvailableTeams([...matchData.teams]);
            setFilteredTeams([...matchData.teams]);

            // Set options
            const optionsList = divisionsToOptionList(matchData.divisions);
            setDivisions(optionsList);
        }
    }, [matchData]);

    return (
        <form onSubmit={handleAddMatch} className='flex flex-wrap w-full justify-between items-center'>
            <DateInput handleInputChange={handleInputChange} name='date' required={!update} defaultValue={addMatch.date} vertical extraCls='md:w-5/12' />

            {!update && (<>
                <SelectInput name='divisions' optionList={divisions} handleSelect={handleDivisionChange} vertical extraCls='md:w-5/12' />
                <SelectInput name='teamA' lblTxt='Team A' optionList={showTeamList(filteredTeams)} handleSelect={handleSelectChange} defaultValue={addMatch.teamA} vertical extraCls='md:w-5/12' />
                <SelectInput name='teamB' lblTxt='Team B' optionList={showTeamList(filteredTeams)} handleSelect={handleSelectChange} defaultValue={addMatch.teamB} vertical extraCls='md:w-5/12' />
            </>)}

            <h3 className='w-full'>Default settings</h3>
            <NumberInput required={!update} lblTxt='Number of nets' name='numberOfNets' defaultValue={addMatch.numberOfNets} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Number of rounds' name='numberOfRounds' defaultValue={addMatch.numberOfRounds} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Net Variance' name='netVariance' defaultValue={addMatch.netVariance} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <SelectInput name='homeTeam' defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} vertical extraCls='md:w-5/12' />
            
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={addMatch.autoAssign}
                name="autoAssign" lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput defaultValue={addMatch.autoAssignLogic} name='autoAssignLogic' optionList={assignStrategies.map((as)=> ({value: as, text: as}))} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Sub Clock' name='timeout' defaultValue={addMatch.timeout} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} name='location' required={!update} defaultValue={addMatch.location} vertical extraCls='md:w-5/12' />
            <button className="btn-info mt-4 w-full">{update ? 'Update' : 'Create'}</button>
        </form>
    )
}

export default MatchAdd;