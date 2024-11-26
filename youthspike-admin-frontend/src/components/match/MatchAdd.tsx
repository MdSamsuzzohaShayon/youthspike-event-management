import { useMutation } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import DateInput from '../elements/forms/DateInput';
import { IAddMatch, IDefaultMatchProps, IError, IEventExpRel, IGroup, IGroupExpRel, IMatch, IMatchExpRel, IOption, ITeam } from '@/types';
import TextInput from '../elements/forms/TextInput';
import NumberInput from '../elements/forms/NumberInput';
import SelectInput from '../elements/forms/SelectInput';
import staticData from '../../lib/data.json';
import ToggleInput from '../elements/forms/ToggleInput';
import { CREATE_MATCH, UPDATE_MATCH } from '@/graphql/matches';
import { assignStrategies } from '@/utils/staticData';
import { EAssignStrategies } from '@/types/elements';
import addOrUpdateMatch from '@/utils/requestHandlers/addOrUpdateMatch';
import { useRouter } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';

interface IMatchTeams extends IDefaultMatchProps {
    teams: ITeam[]; // add teams to IDefaultEventMatch
}

interface IMatchAddProps {
    eventId: string;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    groupList: IGroupExpRel[];
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
    groupList,
    update,
    matchId,
    eventData,
    showAddMatch,
    prevMatch, addMatchCB }: IMatchAddProps) {


    const router = useRouter();
    const { ldoIdUrl } = useLdoId();

    const { homeTeamStrategy, assignLogicList, rosterLockList } = staticData;

    // Local State
    const [addMatch, setAddMatch] = useState<IAddMatch>(initialAddMatch);
    const [updateMatch, setUpdateMatch] = useState<Partial<IAddMatch>>({});
    const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>(teamList ?? []);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // GraphQL
    const [createMatch, { client }] = useMutation(CREATE_MATCH);
    const [mutateMatch, { client: updateClient }] = useMutation(UPDATE_MATCH);


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

    const handleDateChange = ({ name, value }: { name: string, value: string }) => {
        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, [name]: value }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, [name]: value }));
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

    const handleGroupChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLSelectElement;
        setSelectedGroup(inputEl.value !== '' ? inputEl.value : null);
        const groupExist = groupList.find((g) => g._id === inputEl.value);
        if (groupExist && groupExist.teams && groupExist.teams.length > 0) {
            const teamsOfGroup = groupExist.teams.map((gt) => gt._id);
            const newTeamList = teamList?.filter((t) => teamsOfGroup.includes(t._id)) || [];
            setFilteredTeamList(newTeamList);

        }
    }

    /**
     * Submit add match
     */
    const handleAddMatch = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateMatch({ setIsLoading, eventId, mutateMatch, createMatch, matchId, addMatch, ldoIdUrl, currDivision, setActErr, updateMatch, update, showAddMatch, router, addMatchCB });
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
                mObj.fwango = eventData?.fwango;
            }
        }
        setAddMatch(mObj);
    }, [eventData, prevMatch]);

    // console.log(groupList);


    return (
        <form onSubmit={handleAddMatch} className='flex flex-wrap w-full justify-between items-center'>
            <DateInput handleDateChange={handleDateChange} name='date' lblTxt='Start time (This is how the matches are ranked.)' 
            required={!update} defaultValue={addMatch.date} vertical />

            {!update && (<>
                <SelectInput key="g-t-d" handleSelect={handleGroupChange} name='group' lblTxt='Group' defaultValue={addMatch.division} optionList={addMatch.division && addMatch.division !== ''
                    ? groupList.filter((g) => g.division.trim().toUpperCase() === addMatch.division.trim().toUpperCase()).map((g) => ({ text: g.name, value: g._id }))
                    : groupList.map((g) => ({ text: g.name, value: g._id }))} vertical />
                {selectedGroup && (
                    <>
                        <SelectInput name='teamA' lblTxt='Team A' 
                        optionList={showTeamList(addMatch.teamB && addMatch.teamB !== "" ? filteredTeamList.filter((t) => t._id !== addMatch.teamB) : filteredTeamList)} 
                        handleSelect={handleSelectChange} vertical extraCls='md:w-5/12' />
                        <SelectInput name='teamB' lblTxt='Team B' 
                        optionList={showTeamList(addMatch.teamA && addMatch.teamA !== "" ? filteredTeamList.filter((t) => t._id !== addMatch.teamA) : filteredTeamList)} 
                        handleSelect={handleSelectChange} vertical extraCls='md:w-5/12' />
                    </>
                )}
            </>)}
            <div className="mt-4 w-full">
                <h3 className='w-full capitalize'>Default settings</h3>
            </div>
            <NumberInput required={!update} lblTxt='Number of nets' name='numberOfNets' defaultValue={addMatch.numberOfNets} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Number of rounds' name='numberOfRounds' defaultValue={addMatch.numberOfRounds} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Net Variance' name='netVariance' defaultValue={addMatch.netVariance} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />

            <SelectInput name='homeTeam' defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} vertical extraCls='md:w-5/12' />

            {/* @ts-ignore */}
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={addMatch.autoAssign}
                name="autoAssign" lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput defaultValue={addMatch.autoAssignLogic} name='autoAssignLogic' optionList={assignStrategies.map((as) => ({ value: as, text: as }))} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            <NumberInput required={!update} lblTxt='Sub Clock' name='timeout' defaultValue={addMatch.timeout} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} lblTxt="Fwango Link" name="fwango" defaultValue={addMatch.fwango} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} name='description' required={!update} defaultValue={addMatch.description} vertical extraCls='md:w-5/12' />
            <button className="btn-info mt-4 w-full">{update ? 'Update' : 'Create'}</button>
        </form>
    )
}

export default MatchAdd;