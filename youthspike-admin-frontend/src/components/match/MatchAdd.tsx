import { useMutation } from '@apollo/client';
import React, { useCallback, useEffect, useState } from 'react';
import DateInput from '../elements/forms/DateInput';
import { IAddMatch, IDateChangeHandlerProps, IEventExpRel, IGroupExpRel, IMatchExpRel, ITeam } from '@/types';
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
import { ERosterLock, ETieBreakingStrategy } from '@/types/event';
import { useError } from '@/lib/ErrorContext';
import { ETeam } from '@/types/team';



interface IMatchAddProps {
    eventId: string;
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


const lockTimes = [
    {
        id: 1,
        type: ERosterLock.FIRST_ROSTER_SUBMIT,
        text: "First Roster Submit"
    },
    {
        id: 2,
        type: ERosterLock.PICK_A_DATE,
        text: "Pick A Date"
    },
]



console.log(new Date().toISOString());


const initialAddMatch: IAddMatch = {
    date: new Date().toISOString(),
    event: "",
    description: "",
    location: "",
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
    tieBreaking: ETieBreakingStrategy.TWO_POINTS_NET
    // group: "" // Optional
}


function MatchAdd({ eventId,
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
    const { setActErr } = useError();

    const { homeTeamStrategy } = staticData;

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

    const handleRosterLockDate = ({ name, value }: IDateChangeHandlerProps) => {

        if (update) {
            setUpdateMatch((prevState) => ({ ...prevState, rosterLock: value }));
        } else {
            setAddMatch((prevState) => ({ ...prevState, rosterLock: value }));
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
        if (inputEl.value.toLowerCase() === "all") {
            if (update) {
                setUpdateMatch((prevState) => ({ ...prevState, group: undefined }));
            } else {
                setAddMatch((prevState) => ({ ...prevState, group: undefined }));
            }
        } else {
            if (update) {
                setUpdateMatch((prevState) => ({ ...prevState, group: inputEl.value }));
            } else {
                setAddMatch((prevState) => ({ ...prevState, group: inputEl.value }));
            }
        }
        const groupExist = groupList.find((g) => g._id === inputEl.value);
        if (groupExist && groupExist?.teams) {
            const teamsOfGroup = groupExist.teams.map((gt) => gt._id);
            const newTeamList = teamList?.filter((t) => teamsOfGroup.includes(t._id)) || [];
            setFilteredTeamList(newTeamList);
        } else if (inputEl.value.toLowerCase() === "all" && teamList) {
            setFilteredTeamList(teamList);
        }
    }

    /**
     * Submit add match
     */
    const handleAddMatch = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await addOrUpdateMatch({ setActErr, setIsLoading, eventId, mutateMatch, createMatch, matchId, addMatch, ldoIdUrl, currDivision, updateMatch, update, showAddMatch, router, addMatchCB });
    }

    /**
     * Show select items list
     */
    const showTeamOptions=useCallback((teamE: ETeam)=>{
        // showTeamList(addMatch.teamB && addMatch.teamB !== "" ? filteredTeamList.filter((t) => t._id !== addMatch.teamB) : filteredTeamList)
        let nList: ITeam[] = filteredTeamList;
        if(teamE === ETeam.teamA){
            if(addMatch.teamB && addMatch.teamB !== ""){
                nList = filteredTeamList.filter((t) => t._id !== addMatch.teamB)
            }
        }else{
            if(addMatch.teamA && addMatch.teamA !== ""){
                nList = filteredTeamList.filter((t) => t._id !== addMatch.teamA)
            }
        }
        return nList.map((t)=> ({value: t._id, text: t.name}));
    }, [filteredTeamList, addMatch, selectedGroup]);




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
                mObj.date = eventData.startDate;
                mObj.netVariance = eventData.netVariance;
                mObj.autoAssign = eventData.autoAssign;
                mObj.timeout = eventData.timeout;
                mObj.rosterLock = eventData.rosterLock;
                mObj.homeTeam = eventData.homeTeam;
                mObj.description = eventData.description;
                mObj.location = eventData.location;
                mObj.tieBreaking = eventData.tieBreaking;
                mObj.fwango = eventData?.fwango;
            }
        }
        
        setAddMatch(mObj);
    }, [eventData, prevMatch]);




    return (
        <form onSubmit={handleAddMatch} className='flex flex-wrap w-full justify-between items-center'>
            {addMatch.date && <DateInput handleDateChange={handleDateChange} name='date' lblTxt='Start time'
                required={!update} defaultValue={addMatch.date} vertical />}

            {!update && (<>
                <SelectInput key="g-t-d" handleSelect={handleGroupChange} name='group' lblTxt='Group' defaultValue={addMatch.division} optionList={addMatch.division && addMatch.division !== ''
                    ? [{ text: "All", value: "all" }, ...groupList.filter((g) => g.division.trim().toUpperCase() === addMatch.division.trim().toUpperCase()).map((g) => ({ text: g.name, value: g._id }))]
                    : [{ text: "All", value: "all" }, ...groupList.map((g) => ({ text: g.name, value: g._id }))]} vertical />
                {selectedGroup && (
                    <>
                        <SelectInput name='teamA' lblTxt='Team A'
                            optionList={showTeamOptions(ETeam.teamA)}
                            handleSelect={handleSelectChange} vertical extraCls='md:w-5/12' />
                        <SelectInput name='teamB' lblTxt='Team B'
                            optionList={showTeamOptions(ETeam.teamB)}
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

            <SelectInput key="si-1" name='homeTeam' defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} vertical extraCls='md:w-5/12' />
            <SelectInput key="si-2" name="tieBreaking" value={addMatch.tieBreaking}
                optionList={[{ text: "Overtime round", value: ETieBreakingStrategy.OVERTIME_ROUND }, { text: "Two Points Net", value: ETieBreakingStrategy.TWO_POINTS_NET }]}
                lblTxt="Tie breaking strategy" handleSelect={handleInputChange} vertical extraCls='md:w-5/12' />

            {/* @ts-ignore */}
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={addMatch.autoAssign}
                name="autoAssign" lw='w-3/6' extraCls='md:w-5/12' />
            <SelectInput key="si-3" defaultValue={addMatch.autoAssignLogic} name='autoAssignLogic' optionList={assignStrategies.map((as) => ({ value: as, text: as }))} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />

            <SelectInput key="si-4" name='rosterLock'
                defaultValue={addMatch.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT || addMatch.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT ? addMatch.rosterLock : ERosterLock.PICK_A_DATE}
                optionList={lockTimes.map((lt) => ({ value: lt.type, text: lt.text }))} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' extraCls='md:w-5/12' />
            {addMatch.rosterLock && addMatch.rosterLock !== "" && addMatch.rosterLock !== ERosterLock.FIRST_ROSTER_SUBMIT.toString() && (
                <DateInput name='rosterLockDate' lblTxt='Pick A date when ranking is going to lock' handleDateChange={handleRosterLockDate} defaultValue={addMatch.rosterLock} vertical extraCls='md:w-5/12' />
            )}

            <NumberInput required={!update} lblTxt='Sub Clock' name='timeout' defaultValue={addMatch.timeout} handleInputChange={handleNumInputChange} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} lblTxt="Fwango Link" name="fwango" defaultValue={addMatch.fwango} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} name='description' required={!update} defaultValue={addMatch.description} vertical extraCls='md:w-5/12' />
            <TextInput handleInputChange={handleInputChange} name='location' required={!update} defaultValue={addMatch.location} vertical extraCls='md:w-5/12' />
            <button className="btn-info mt-4 w-full">{update ? 'Update' : 'Create'}</button>
        </form>
    )
}

export default MatchAdd;