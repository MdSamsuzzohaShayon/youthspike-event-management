'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useApolloClient, useLazyQuery, useQuery, gql } from '@apollo/client';
import { GET_EVENT_WITH_TEAMS, GET_TEAMS_BY_EVENT } from '@/graphql/teams';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IOption, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import SelectInput from '../elements/forms/SelectInput';

interface ITeamsOfEventPage {
    eventId: string
}

function TeamMain({ eventId }: ITeamsOfEventPage) {

    const client = useApolloClient();
    const teamAddEl = useRef<HTMLDialogElement | null>(null);
    const importerEl = useRef<HTMLDialogElement | null>(null);
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [actErr, setActErr] = useState<IError | null>(null);
    const [teamList, setTeamList] = useState<ITeam[]>([]);
    const [filteredList, setFilteredlist] = useState<ITeam[]>([]);
    const [divisionList, setDivisionList] = useState<IOption[]>([]);

    /**
     * Fetch all teams, players, matches of this event from GraphQL Server
     */
    const [getEvent, { data: eventData, loading, error }] = useLazyQuery(GET_EVENT_WITH_TEAMS);


    const handleDivisionSelection = (e: React.SyntheticEvent) => {
        e.preventDefault();
        /**
         * Filter items
         */
        const inputEl = e.target as HTMLInputElement;
        const newList = teamList.filter((t)=> t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
        // console.log({inputted: inputEl.value, filtered: newList});
        setFilteredlist([...newList]);
    }


    const closeDialog=()=>{
        if (teamAddEl.current) teamAddEl.current.close();
        if (importerEl.current) importerEl.current.close();
    }

    const handleClose = (e: React.SyntheticEvent) => {
        e.preventDefault();
        closeDialog();
    }

    const handleFilter = (e: React.SyntheticEvent, filteredItemId: number) => {
        e.preventDefault();
    }

    const fetchEvent = async () => {
        const eventResponse = await getEvent({ variables: { eventId: eventId } });

        const newTeamList = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
        setTeamList(newTeamList);
        setFilteredlist(newTeamList);

        // Making divisions list
        const divisions = eventResponse?.data?.getEvent?.data?.divisions ? eventResponse?.data?.getEvent?.data?.divisions : [];
        const divs  = divisionsToOptionList(divisions);
        setDivisionList(divs);
    }

    // Do this for all event pages
    useEffect(() => {
        if (eventId) {
            if (isValidObjectId(eventId)) {
                fetchEvent();
            } else {
                setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
            }
        }

    }, [eventId]);


    if (loading || isLoading) return <Loader />;



    return (
        <div className="TeamMain">
            <dialog ref={teamAddEl} >
                <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
                <h3>New Event</h3>
                {/* <TeamAdd handleClose={handleClose} /> */}
            </dialog>
            <dialog ref={importerEl}>
                <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
                <MultiPlayerAdd eventId={eventId} setIsLoading={setIsLoading} closeDialog={closeDialog} />
            </dialog>
            <h1 className='mb-4 text-2xl font-bold pt-6 text-center mb-8'>Teams</h1>
            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}
            {/* <div className="w-full flex justify-between items-center flex-col mb-4">
                <div className="logo w-20">
                    <img src="/free-logo.svg" alt="program-playoffs" className='w-full' />
                </div>
                <h3 className='text-2xl'>Program Playoffs</h3>
                <p className="date flex mt-2"><span><img src="/icons/clock.svg" alt="clock" className='w-6 svg-white mr-2' /></span> Apr 5, 2024 - Apr 5, 2024</p>
                <p className="date flex mt-2"><span><img src="/icons/location.svg" alt="location" className='w-6 svg-white mr-2' /></span> Orlando, Florida</p>
            </div> */}
            <div className="mb-4 division-selection w-full">
            <SelectInput handleSelect={handleDivisionSelection} name='division' optionList={divisionList} lw='w-5/12' rw='w-5/12' />
            </div>
            <div className="mb-8 make-team flex w-full justify-between">
                <Link className='btn-info flex justify-between items-center gap-2' href={`/${eventId}/teams/new`}>
                    <span><img src="/icons/plus.svg" alt="plus" className='w-6 svg-white' /></span>Add New Team
                </Link>
                <button onClick={(e) => { if (importerEl.current) importerEl.current.showModal() }} className="btn-info flex justify-between items-center gap-2"><span><img src="/icons/import.svg" alt="import" className='w-6 svg-white' /></span>Import File</button>
            </div>
            <div className="list-with-filter w-full relative">
                <div className="action-section flex justify-between mb-4">
                    <div className="input-group flex items-center gap-2 justify-between">
                        <input type="checkbox" name="bulkaction" id="bulk-action" />
                        <label htmlFor="bulk-action">Bulk Action</label>
                        <img src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
                    </div>
                    <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={(e) => setShowFilter((prevState) => !prevState)} >
                        <p>A-Z</p>
                        <img src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
                    </div>
                    <ul className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
                        <li role="presentation" onClick={(e) => handleFilter(e, 1)}>Copy</li>
                        <li role="presentation" onClick={(e) => handleFilter(e, 2)} >Edit</li>
                    </ul>
                </div>
                {filteredList.length > 0 && <TeamList eventId={eventId} teamList={filteredList} />}
            </div>
        </div>
    )
}

export default TeamMain;