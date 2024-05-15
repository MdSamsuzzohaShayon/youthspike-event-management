import { useMutation } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import DateInput from '../elements/forms/DateInput';
import { IAddMatch, IDefaultMatchProps, IError, IEventExpRel, IMatch, IMatchExpRel, IOption, ITeam } from '@/types';
import TextInput from '../elements/forms/TextInput';
import NumberInput from '../elements/forms/NumberInput';
import SelectInput from '../elements/forms/SelectInput';
import staticData from '../../lib/data.json';
import ToggleInput from '../elements/forms/ToggleInput';
import { CREATE_MATCH, GET_EVENT_WITH_MATCHES_TEAMS, UPDATE_MATCH } from '@/graphql/matches';
import { assignStrategies } from '@/utils/staticData';
import { EAssignStrategies } from '@/types/elements';
import addOrUpdateMatch from '@/utils/requestHandlers/addOrUpdateMatch';
import { useRouter } from 'next/navigation';

interface IMatchTeams extends IDefaultMatchProps {
    teams: ITeam[]; // add teams to IDefaultEventMatch
}

interface IMatchAddProps {
    eventId: string;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    currDivision?: string;
    update?: boolean;
    teamList?: ITeam[];
    matchId?: string;
    eventData?: IEventExpRel | null;
    showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
    prevMatch?: IMatchExpRel;
    addMatchCB?: (matchData: IMatchExpRel) => void;
}


const initialAddMatch: IAddMatch = {
    date: new Date().toISOString(),
    event: "",
    description: "",
    numberOfNets: 0,
    numberOfRounds: 0,
    teamA: "",
    teamB: "",
    autoAssignLogic: EAssignStrategies.AUTO,
    // Default settings
    autoAssign: false,
    division: '',
    netVariance: 0,
    homeTeam: '',
    rosterLock: '',
    timeout: 0,
}


function MatchAdd({ eventId,
    setActErr,
    setIsLoading,
    teamList,
    currDivision,
    update,
    matchId,
    eventData,
    showAddMatch,
    prevMatch, addMatchCB }: IMatchAddProps) {
    const { homeTeamStrategy, assignLogicList, rosterLockList } = staticData;

    // Local State
    const [addMatch, setAddMatch] = useState<IAddMatch>(initialAddMatch);
    const [updateMatch, setUpdateMatch] = useState<Partial<IAddMatch>>({});

    // GraphQL
    const [createMatch, { client }] = useMutation(CREATE_MATCH);
    const [mutateMatch, { client: updateClient }] = useMutation(UPDATE_MATCH);

    const router = useRouter();

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
        await addOrUpdateMatch({ setIsLoading, eventId, mutateMatch, createMatch, matchId, addMatch, currDivision, setActErr, updateMatch, update, showAddMatch, router, addMatchCB });
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


    // Need to show number of rounds and number of net and net variance etc
    useEffect(() => {
        let mObj = structuredClone(initialAddMatch);
        if (prevMatch) {
            // @ts-ignore
            mObj = prevMatch;
        } else {
            if (eventData) {
                mObj.numberOfRounds = eventData.rounds;
                mObj.numberOfNets = eventData.nets;
                mObj.netVariance = eventData.netVariance;
                mObj.autoAssign = eventData.autoAssign;
                mObj.timeout = eventData.timeout;
                mObj.rosterLock = eventData.rosterLock;
                mObj.homeTeam = eventData.homeTeam;
                mObj.description = eventData.description;
            }
        }
        setAddMatch(mObj);
    }, [eventData, prevMatch]);

    return (
        <form onSubmit={handleAddMatch} className='flex flex-wrap w-full justify-between items-center'>
            <DateInput key={crypto.randomUUID()} handleInputChange={handleInputChange} name='date' required={!update} defaultValue={addMatch.date} vertical extraCls='md:w-5/12' />

            {!update && (<>
                <SelectInput name='teamA' lblTxt='Team A' optionList={showTeamList(teamList)} handleSelect={handleSelectChange} defaultValue={addMatch.teamA} vertical extraCls='md:w-5/12' />
                <SelectInput name='teamB' lblTxt='Team B' optionList={showTeamList(teamList)} handleSelect={handleSelectChange} defaultValue={addMatch.teamB} vertical extraCls='md:w-5/12' />
            </>)}
            <div className="mt-4 w-full">
                <h3 className='w-full capitalize'>Default settings</h3>
            </div>
            <NumberInput required={!update} lblTxt='Number of nets' name='numberOfNets' defaultValue={addMatch.numberOfNets} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Number of rounds' name='numberOfRounds' defaultValue={addMatch.numberOfRounds} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Net Variance' name='netVariance' defaultValue={addMatch.netVariance} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            
            <SelectInput name='homeTeam' defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} vertical extraCls='md:w-5/12' />

            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={addMatch.autoAssign}
                name="autoAssign" lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput defaultValue={addMatch.autoAssignLogic} name='autoAssignLogic' optionList={assignStrategies.map((as) => ({ value: as, text: as }))} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Sub Clock' name='timeout' defaultValue={addMatch.timeout} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} name='description' required={!update} defaultValue={addMatch.description} vertical extraCls='md:w-5/12' />
            <button className="btn-info mt-4 w-full">{update ? 'Update' : 'Create'}</button>
        </form>
    )
}

export default MatchAdd;