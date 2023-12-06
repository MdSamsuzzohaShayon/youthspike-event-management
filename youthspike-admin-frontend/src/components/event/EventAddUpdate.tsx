import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ADD_EVENT, ADD_EVENT_RAW, UPDATE_EVENT, UPDATE_EVENT_RAW } from '@/graphql/event';
import { AdvancedImage } from '@cloudinary/react';
import { useMutation } from '@apollo/client';

// Components
import ToggleInput from '../elements/forms/ToggleInput';
import SelectInput from '../elements/forms/SelectInput';
import TextInput from '../elements/forms/TextInput';
import NumberInput from '../elements/forms/NumberInput';

// Utils/Config
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';

// TypeScript
import { IEventAddProps, IEventAdd, IOption } from '@/types';
import { UserRole } from '@/types/user';


// Select Input Options
const homeTeamStrategyList: IOption[] = [{ value: 'toss', text: "Toss" }];
const rosterLockList: IOption[] = [{ value: 'first', text: 'First roster submit' }];
const assignLogicList: IOption[] = [{ value: 'hight' }, { value: 'random' }];

const initialEvent = {
    name: 'N-2',
    // startDate, endDate, playerLimit
    divisions: 'division 1, division 2,',
    nets: 3,
    rounds: 2,
    netVariance: 3,
    homeTeam: homeTeamStrategyList[0].value,
    autoAssign: false,
    autoAssignLogic: assignLogicList[1].value,
    rosterLock: rosterLockList[0].value,
    timeout: 3,
    passcode: '0913',
    coachPassword: 'Spikeball',
    location: 'USA',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    // ldo: new Date().toISOString(),
    playerLimit: 10,
    active: true
}

function EventAddUpdate({ update, setActErr, prevEvent, setIsLoading }: IEventAddProps) {
    // Hooks
    const router = useRouter();
    const user = useUser();
    const searchParams = useSearchParams();
    const pName = usePathname();

    // Local State
    const sponsorInputEl = useRef<HTMLInputElement>(null);
    const [eventState, setEventState] = useState<IEventAdd>(prevEvent ? prevEvent : initialEvent);
    const [updateEvent, setUpdateEvent] = useState<Partial<IEventAdd>>({});
    const [sponsorImgList, setSponsorImgList] = useState<File[] | string[]>(prevEvent && prevEvent.sponsors ? prevEvent.sponsors : []);
    const [directorId, setDirectorId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);

    // GraphQL
    const [eventAdd, { error: eaErr, loading: eaLoading, data: eaData }] = useMutation(ADD_EVENT);
    const [eventUpdate, { error: euErr, loading: euLoading, data: euData }] = useMutation(UPDATE_EVENT);

    /**
     * Add event mutation
     */
    const handleEventAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        setIsLoading(true);
        let newEventId = null;
        const inputData = update ? { ...updateEvent } : { ...eventState };
        inputData.ldo = directorId ? directorId : 'auto_detect_from_server';
        const mutationVariables = {
            sponsors: sponsorImgList.length > 0 ? null : [],
            input: inputData,
        };
        // @ts-ignore
        if (update && eventId) mutationVariables.eventId = eventId;

        try {
            if (sponsorImgList.length > 0 && sponsorInputEl.current && sponsorInputEl.current.value && sponsorInputEl.current?.value !== '') {
                // Use FormData with fetch if there is a file to upload on the server
                const formData = new FormData();
                formData.set('operations', JSON.stringify({
                    query: update ? UPDATE_EVENT_RAW : ADD_EVENT_RAW,
                    variables: mutationVariables,
                }));
                formData.set('map', JSON.stringify({ '0': ['variables.sponsors'] }));

                // Append sponsors to the FormData
                sponsorImgList.forEach((file, index) => {
                    formData.set(index.toString(), file);
                });

                const token = getCookie('token');
                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const responseData = await response.json();
                const eventRes = update ? responseData?.data?.updateEvent : responseData?.data?.createEvent;
                if (eventRes?.code !== 201 && eventRes?.code !== 202) {
                    setActErr({
                        name: eventRes?.code,
                        message: eventRes?.message,
                        main: responseData.data,
                    });
                } else {
                    newEventId = eventRes?.data?._id;
                }
            } else {
                // Use Apollo Client mutation
                if (!mutationVariables.sponsors) mutationVariables.sponsors = [];
                let eventRes = null;
                if (update) {
                    eventRes = await eventUpdate({ variables: mutationVariables });
                } else {
                    eventRes = await eventAdd({ variables: mutationVariables });
                }
                eventRes = update ? eventRes.data?.updateEvent : eventRes.data?.createEvent;
                if (eventRes?.code !== 201 && eventRes?.code !== 202) {
                    setActErr({ name: eventRes.code, message: eventRes.message })
                } else {
                    newEventId = eventRes.data._id
                }

            }

            // Reset form and navigate
            setEventState(initialEvent);
            const formEl = e.target as HTMLFormElement;
            formEl.reset();

            if (newEventId) {
                let redirectUrl = `/${newEventId}`;
                if (user.info?.role === UserRole.admin) {
                    redirectUrl += `/?directorId=${directorId}`;
                }
                router.push(redirectUrl);
            };
        } catch (error) {
            // @ts-ignore
            setActErr({ name: 'Invalid Mutation', message: error.message || '', main: error });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Change input on cange event
     */
    const handleInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (!update) {
            setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleToggleInput = (e: React.SyntheticEvent, stateName: string) => {
        e.preventDefault();
        if (!update) {
            // @ts-ignore
            const prevStateVal: boolean = eventState[stateName];
            setEventState((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
        } else {
            // @ts-ignore
            const prevStateVal: boolean = eventState[stateName] ? eventState[stateName] : false;
            setUpdateEvent((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
        }
    }

    const handleImgRemove = (e: React.SyntheticEvent, imgName: string) => {
        e.preventDefault();
        // @ts-ignore
        setSponsorImgList((prevState) => {
            return prevState.filter((imgFile) => typeof imgFile === "string" ? imgFile !== imgName : imgFile.name !== imgName);
        });
    }

    /**
     * File Upload
     */
    const handleOpenImg = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!sponsorInputEl.current) return;
        sponsorInputEl.current.click();
    }

    const handleFileChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const fileInputEl = e.target as HTMLInputElement;
        if (fileInputEl.files && fileInputEl.files.length > 0) {
            // @ts-ignore
            setSponsorImgList((prevState) => ([...prevState, fileInputEl.files[0]]));
        }
    }

    /**
     * Lifecycle hooks
     */
    useEffect(() => {
        // Getting event Id from url
        const pnList = pName.split("/");
        if (pnList.includes("settings")) { // settings = edit event page
            const nPnList = pnList.filter(pn => pn !== '');
            const newEventId = nPnList[0];
            setEventId(newEventId);
        }
        // Getting Director Id
        if (user.info?.role === UserRole.admin) {
            const newDirectorId = searchParams.get('directorId');
            if (!newDirectorId) return router.push('/admin');
            setDirectorId(newDirectorId);
        } else {
            setDirectorId(user.info?._id ? user.info._id : null);
        }
    }, [user]);

    /**
     * Renders
     */
    const renderDivisions = (dStr: string) => {
        if (!dStr.includes(',')) return <ul>{dStr}</ul>;
        const dList: string[] = dStr.split(',');
        const listEl: React.ReactNode[] = [];
        for (let i = 0; i < dList.length; i += 1) {
            if (dList[i].trim() !== '') {
                listEl.push(<li className='px-4 py-2 rounded-full bg-gray-800 flex items-center justify-between' key={dList[i] + '-' + i}>{dList[i]}</li>);
            }
        }
        return <ul className='flex gap-1'>{listEl}</ul>
    }

    const renderSponsorImg = (fileList: File[] | string[]) => {
        const imgElList: React.ReactNode[] = []
        for (let i = 0; i < fileList.length; i += 1) {
            let imgEl = null;
            if (typeof fileList[i] === "string") {
                const imgUrl = fileList[i] as string;
                imgEl = <AdvancedImage className="w-20 static" cldImg={cld.image(imgUrl)} />;
            } else {
                const imgFile = fileList[i] as File;
                imgEl = (
                    <img
                        src={URL.createObjectURL(imgFile)}
                        alt={`Sponsor ${i + 1}`}
                        className="w-20 static"
                        key={imgFile.name + '' + i}
                    />
                );
            }
            const liEl = (
                <li className='relative' key={i}>
                    {imgEl}
                    <img src='/icons/close.svg' className='absolute top-1 right-1 w-6 h-6 rounded-full svg-white'
                        role="presentation"
                        // @ts-ignore 
                        onClick={e => handleImgRemove(e, typeof fileList[i] === "string" ? fileList[i] : fileList[i].name)}
                    />
                </li>
            );
            imgElList.push(liEl);
        }

        return (<ul className="show-sponsors flex justify-between w-full items-center flex-wrap">{imgElList}</ul>);
    }

    return (
        <form onSubmit={handleEventAdd} className='flex flex-col gap-2'>
            <TextInput required={!update} defaultValue={eventState.name} handleInputChange={handleInputChange} lblTxt='Name' name='name' lw='w-2/6' rw='w-4/6' />
            <TextInput required={!update} defaultValue={eventState.divisions} handleInputChange={handleInputChange} lblTxt='DIVISIONS' name='divisions' lw='w-2/6' rw='w-4/6' />
            {renderDivisions(eventState.divisions)}
            {/* Default setting  */}
            <h3 className='text-2xl capitalize mt-4'>Default setting</h3>

            <NumberInput defaultValue={eventState.nets} handleInputChange={handleInputChange} lblTxt='Number of nets' name='nets' required={!update} />
            <NumberInput defaultValue={eventState.rounds} handleInputChange={handleInputChange} lblTxt='Number of rounds' name='rounds' required={!update} />
            <NumberInput defaultValue={eventState.netVariance} handleInputChange={handleInputChange} lblTxt='Net Variance' name='netVariance' required={!update} />

            <SelectInput name='homeTeam' defaultValue={eventState.homeTeam} optionList={homeTeamStrategyList} lblTxt='How is home team decided?' handleSelect={handleInputChange} />
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={eventState.autoAssign}
                name="autoAssign" />
            <SelectInput defaultValue={eventState.autoAssignLogic} name='autoAssignLogic' optionList={assignLogicList} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            {/* 
            <div className="input-group w-full flex flex-col">
                <label htmlFor="name">Name</label>
                <input className='border border-gray-300 p-1' type="text" defaultValue={name} required={!update} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="input-group w-full flex flex-col">
                <label htmlFor="startDate">Start</label>
                <input className='border border-gray-300 p-1' type="datetime-local" defaultValue={startDate} required={!update} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="input-group w-full flex flex-col">
                <label htmlFor="endDate">End</label>
                <input className='border border-gray-300 p-1' type="datetime-local" defaultValue={endDate} required={!update} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="input-group w-full flex flex-col">
                <label htmlFor="playerLimit">Player Limit</label>
                <input className='border border-gray-300 p-1' type="number" required={!update} onChange={(e) => setPlayerLimit(parseInt(e.target.value, 10))} />
            </div>
            <div className="input-group w-full">
                <button className='border border-gray-300 bg-gray-900 text-gray-300 p-2' type='submit'>Create</button>
            </div> */}
            <div className="sponsors-heading flex justify-between w-full mt-4 items-center">
                <h3 className='text-2xl capitalize'>Sponsors</h3>
                <button type="button" onClick={handleOpenImg} className="btn-primary">Add New</button>
                <input type="file" name="sponsor" id="sponsor" className='hidden' ref={sponsorInputEl} onChange={handleFileChange} />
            </div>
            {renderSponsorImg(sponsorImgList)}
            <button className="btn-info" type="submit" >{update ? "Update" : "Submit"}</button>
        </form>
    )
}

export default EventAddUpdate;