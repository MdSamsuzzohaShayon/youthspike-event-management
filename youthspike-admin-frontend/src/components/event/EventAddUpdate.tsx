import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ADD_EVENT, ADD_EVENT_RAW, GET_A_EVENT, UPDATE_EVENT, UPDATE_EVENT_RAW } from '@/graphql/event';
import { AdvancedImage } from '@cloudinary/react';
import { useApolloClient, useMutation } from '@apollo/client';


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
import { IEventAddProps, IEventAdd, IOption, IEventSponsorAdd } from '@/types';
import { UserRole } from '@/types/user';

import staticData from '../../lib/data.json';
import DateInput from '../elements/forms/DateInput';
import ShowDivisions from './ShowDivisions';
import ShowSponsors from './ShowSponsors';
import { assignStrategies } from '@/utils/staticData';
import useClickOutside from '../../../hooks/useClickOutside';
import AnyFileInput from '../elements/forms/AnyFileInput';


// Select Input Options
const { homeTeamStrategy, rosterLockList } = staticData;

const initialEvent = {
    name: 'Event 1',
    // startDate, endDate, playerLimit
    // divisions: 'Premier, Contender, Womans',
    divisions: '',
    nets: 3,
    rounds: 2,
    netVariance: 3,
    homeTeam: homeTeamStrategy[0].value,
    autoAssign: false,
    autoAssignLogic: assignStrategies[0],
    rosterLock: rosterLockList[0].value,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    playerLimit: 10,
    active: true,
    timeout: 3,
    coachPassword: 'Spikeball',
    location: 'USA',
};

const initialCurrSponsor = { logo: null, company: '' };

function EventAddUpdate({ update, setActErr, prevEvent, setIsLoading }: IEventAddProps) {
    // Hooks
    const router = useRouter();
    const user = useUser();
    const searchParams = useSearchParams();
    const pName = usePathname();

    // Local State
    const sponsorInputEl = useRef<HTMLInputElement>(null);
    const addSponsorDialogEl = useRef<HTMLDialogElement | null>(null);
    const [currSponsor, setCurrSponsor] = useState<IEventSponsorAdd>(initialCurrSponsor);

    const [eventState, setEventState] = useState<IEventAdd>(prevEvent ? prevEvent : initialEvent);
    const [updateEvent, setUpdateEvent] = useState<Partial<IEventAdd>>({});
    // const [sponsorImgList, setSponsorImgList] = useState<File[] | string[]>(prevEvent && prevEvent.sponsors ? prevEvent.sponsors : []);
    const [sponsorImgList, setSponsorImgList] = useState<IEventSponsorAdd[]>([]);
    const [directorId, setDirectorId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);

    // GraphQL
    const [eventAdd, { error: eaErr, loading: eaLoading, data: eaData }] = useMutation(ADD_EVENT);
    const [eventUpdate, { error: euErr, loading: euLoading, data: euData }] = useMutation(UPDATE_EVENT);

    useClickOutside(addSponsorDialogEl, () => { closeModal(); });

    /**
     * Add event mutation
     */
    const handleEventAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        setIsLoading(true);
        let newEventId = null;
        const inputData = update ? { ...updateEvent } : { ...eventState };
        inputData.ldo = directorId ? directorId : 'auto_detect_from_server';
        if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString()
        if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString()

        const mutationVariables = {
            sponsorsInput: [],
            input: inputData,
        };
        // @ts-ignore
        if (update && eventId) mutationVariables.eventId = eventId;

        try {
            if (sponsorImgList.length > 0 && sponsorInputEl.current && sponsorInputEl.current.value && sponsorInputEl.current?.value !== '') {
                // Use FormData with fetch if there is a file to upload on the server
                const formData = new FormData();

                const sponsorsInputList = [];
                for (let i = 0; i < sponsorImgList.length; i += 1) {
                    sponsorsInputList.push({ company: sponsorImgList[i].company, logo: null });
                }
                // @ts-ignore
                mutationVariables.sponsorsInput = sponsorsInputList;

                formData.set('operations', JSON.stringify({
                    query: update ? UPDATE_EVENT_RAW : ADD_EVENT_RAW,
                    variables: mutationVariables,
                }));

                const mapObj: any = {};
                for (let i = 0; i < sponsorImgList.length; i += 1) {
                    mapObj[i.toString()] = [`variables.sponsorsInput.${i}.logo`];
                }
                formData.set("map", JSON.stringify(mapObj));
                for (let i = 0; i < sponsorImgList.length; i += 1) {
                    if (sponsorImgList[i].logo && sponsorImgList[i].logo instanceof File && sponsorImgList[i].company && sponsorImgList[i].company !== "") {
                        const uploadedFile = sponsorImgList[i].logo as File;
                        formData.set(`${i}`, uploadedFile);
                    }
                }

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
                if (!mutationVariables.sponsorsInput) mutationVariables.sponsorsInput = [];
                let eventRes = null;
                if (update) {
                    eventRes = await eventUpdate({ variables: mutationVariables });
                } else {
                    eventRes = await eventAdd({ variables: mutationVariables });
                }
                // Define the variables you want to use
                // const variables = { eventId: params.eventId };


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

    const handleDivisionInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        if (update && prevEvent?.divisions) {
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

    const handleImgRemove = (e: React.SyntheticEvent, companyName: string) => {
        e.preventDefault();
        // @ts-ignore
        setSponsorImgList((prevState) => { // Need to update
            return prevState.filter((imgFile) => typeof imgFile === "string" ? imgFile !== companyName : imgFile.company !== companyName);
        });
    }

    /**
     * File Upload
     */
    const handleSponsorDialog = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (addSponsorDialogEl.current) {
            setCurrSponsor(initialCurrSponsor);
            addSponsorDialogEl.current.showModal();

            // Reset Input
            let companyInput = document.getElementById('company');
            if (companyInput) {
                // @ts-ignore
                companyInput.value = "";
            };
        }
    }

    const closeModal = () => {
        if (addSponsorDialogEl.current) {
            addSponsorDialogEl.current.close();
        }
    }
    const handleCloseModal = (e: React.SyntheticEvent) => {
        e.preventDefault();
        closeModal();
    }

    const handleFileNameChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (!update) {
            setCurrSponsor((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            // setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleFileChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const fileInputEl = e.target as HTMLInputElement;
        if (!fileInputEl.files || fileInputEl.files.length === 0) return;

        if (currSponsor.company && currSponsor.company !== '') {
            const prevSponsor = sponsorImgList.find((si) => si.company === currSponsor.company);
            let sponsorObj = prevSponsor ? { ...prevSponsor } : { company: currSponsor.company, logo: fileInputEl.files[0] };
            // @ts-ignore
            setSponsorImgList((prevState) => [...prevState.filter((ps) => ps.company !== currSponsor.company), sponsorObj]);
            // @ts-ignore
            setCurrSponsor((prevState) => ({ ...prevState, logo: fileInputEl.files[0] }));
        } else {
            // @ts-ignore
            setCurrSponsor((prevState) => ({ ...prevState, logo: fileInputEl.files[0] }));
            // @ts-ignore
            setSponsorImgList((prevState) => [...prevState, { company: currSponsor.company, logo: fileInputEl.files[0] }]);
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

    return (
        <form onSubmit={handleEventAdd} className='flex flex-col gap-2'>
            <TextInput required={!update} defaultValue={eventState.name} handleInputChange={handleInputChange} lblTxt='Name' name='name' lw='w-2/6' rw='w-4/6' />

            <DateInput required={!update} defaultValue={eventState.startDate} handleInputChange={handleInputChange} lblTxt='Start Date' name='startDate' lw='w-2/6' rw='w-4/6' />
            <DateInput required={!update} defaultValue={eventState.endDate} handleInputChange={handleInputChange} lblTxt='End Date' name='endDate' lw='w-2/6' rw='w-4/6' />

            {!update ? (
                <TextInput required={!update} defaultValue={eventState.divisions} handleInputChange={handleDivisionInputChange} readOnly={update} lblTxt='DIVISIONS' name='divisions' lw='w-2/6' rw='w-4/6' />
            ) : <h4>Divisions</h4>}

            <ShowDivisions update={update} dStr={eventState.divisions}
                prevDivisions={prevEvent && prevEvent.divisions ? prevEvent.divisions : ''}
                setEventState={setEventState} setUpdateEvent={setUpdateEvent} eventId={eventId} updateEvent={updateEvent} />
            {/* Default setting  */}
            <h3 className='text-2xl capitalize mt-4'>Default setting</h3>

            <NumberInput defaultValue={eventState.nets} handleInputChange={handleInputChange} lblTxt='Number of nets' name='nets' required={!update} />
            <NumberInput defaultValue={eventState.rounds} handleInputChange={handleInputChange} lblTxt='Number of rounds' name='rounds' required={!update} />
            <NumberInput defaultValue={eventState.netVariance} handleInputChange={handleInputChange} lblTxt='Net Variance' name='netVariance' required={!update} />

            <SelectInput name='homeTeam' defaultValue={eventState.homeTeam} optionList={homeTeamStrategy} lblTxt='How is home team decided?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <ToggleInput handleValueChange={handleToggleInput} lblTxt='Auto assign when clock runs out' value={eventState.autoAssign}
                name="autoAssign" />
            <SelectInput defaultValue={eventState.autoAssignLogic} name='autoAssignLogic' optionList={assignStrategies.map((as) => ({ value: as, text: as }))} lblTxt='Which auto assign logic when clock runs out?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <SelectInput name='rosterLock' defaultValue={rosterLockList[0].value} optionList={rosterLockList} lblTxt='When does the roster lock setting?' handleSelect={handleInputChange} rw='w-3/6' lw='w-3/6' />
            <NumberInput required lblTxt='Sub Clock' name='timeout' defaultValue={eventState.timeout} handleInputChange={handleInputChange} />

            <TextInput handleInputChange={handleInputChange} lblTxt='Coach Password' name='coachPassword' required defaultValue={eventState.coachPassword} rw='w-3/6' lw='w-3/6' />
            <TextInput handleInputChange={handleInputChange} name='location' required defaultValue={eventState.location} rw='w-3/6' lw='w-3/6' />

            {/* File upload start  */}
            <dialog ref={addSponsorDialogEl} >
                <div className="close-wrapper w-full flex justify-end items-center">
                    <img src='/icons/close.svg' role="presentation" onClick={handleCloseModal} className='svg-white w-6' />
                </div>
                <div className='flex items-center justify-center flex-col'>
                    {/* defaultValue={currSponsor.company} */}
                    <TextInput vertical handleInputChange={handleFileNameChange} name='company' required={false} />
                    <AnyFileInput handleFileChange={handleFileChange} name='logo' vertical lblTxt='Sponsor Logo' />
                    <div className="input-group mt-4">
                        <button className="btn-info" onClick={closeModal}>Ok</button>
                    </div>
                </div>
            </dialog>
            <div className="sponsors-heading flex justify-between w-full mt-4 items-center">
                <h3 className='text-2xl capitalize'>Sponsors</h3>
                <button type="button" onClick={handleSponsorDialog} className="btn-primary">Add New</button>
            </div>
            {/* File upload end  */}
            <ShowSponsors fileList={sponsorImgList} />

            <button className="btn-info" type="submit" >{update ? "Update" : "Submit"}</button>
        </form>
    )
}

export default EventAddUpdate;