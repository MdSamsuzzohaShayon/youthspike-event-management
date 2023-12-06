'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useApolloClient, useLazyQuery, useQuery, gql } from '@apollo/client';
import { GET_EVENT_WITH_TEAMS, GET_TEAMS_BY_EVENT } from '@/graphql/teams';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamList from '@/components/teams/TeamList';
import { isValidObjectId } from '@/utils/helper';
import { IError } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';

interface ITeamsOfEventPage {
        eventId: string
}

function TeamMain({ eventId }: ITeamsOfEventPage) {

    const client = useApolloClient();
    const teamAddEl = useRef<HTMLDialogElement | null>(null);
    const importerEl = useRef<HTMLDialogElement | null>(null);
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [showImporter, setShowImporter] = useState<boolean>(false);
    const [actErr, setActErr] = useState<IError | null>(null);

    /**
     * Fetch all teams, players, matches of this event from GraphQL Server
     */
    const [gerEvent, { data: eventData, loading, error }] = useLazyQuery(GET_EVENT_WITH_TEAMS);


    const handleDivisionSelection = (e: React.SyntheticEvent) => {
        e.preventDefault();
        /**
         * Filter items
         */

    }

    const handleOpenAdd = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (teamAddEl.current) teamAddEl.current.showModal();
    }

    const handleOpenImporter = () => {
        if (importerEl.current) importerEl.current.showModal();
    }

    const handleClose = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (teamAddEl.current) teamAddEl.current.close();
        if (importerEl.current) importerEl.current.close()
    }

    const handleFilter = (e: React.SyntheticEvent, filteredItemId: number) => {
        e.preventDefault();
    }

    // Do this for all event pages
    useEffect(() => {
        if (eventId) {
            if (isValidObjectId(eventId)) {
                gerEvent({ variables: { eventId: eventId } });
            } else {
                setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
            }
        }

    }, [eventId]);

    
    if (loading) return <Loader />;
    const teamList = eventData?.getEvent?.data?.teams ? eventData.getEvent.data.teams : [];
    

    return (
        <div className="TeamMain">
            <dialog ref={teamAddEl} >
                <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
                <h3>New Event</h3>
                {/* <TeamAdd handleClose={handleClose} /> */}
            </dialog>
            {/* <dialog ref={filterListEl}>
                <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
                {itemList.map((item) => <p key={item.id} role="presentation" onClick={(e) => handleSelectItem(e, item.id)} >{item.text}</p>)}
                </dialog> */}
            <dialog ref={importerEl}>
                <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
                <MultiPlayerAdd eventId={eventId} />
            </dialog>
            <h1 className='mb-4 text-2xl font-bold pt-6 text-center mb-8'>Teams</h1>
            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}
            <div className="w-full flex justify-between items-center flex-col mb-4">
                <div className="logo w-20">
                    <img src="/free-logo.svg" alt="program-playoffs" className='w-full' />
                </div>
                <h3 className='text-2xl'>Program Playoffs</h3>
                <p className="date flex mt-2"><span><img src="/icons/clock.svg" alt="clock" className='w-6 svg-white mr-2' /></span> Apr 5, 2024 - Apr 5, 2024</p>
                <p className="date flex mt-2"><span><img src="/icons/location.svg" alt="location" className='w-6 svg-white mr-2' /></span> Orlando, Florida</p>
            </div>
            <div className="mb-4 division-selection w-full">
                <select name="division" id="division" defaultValue='null' className="py-3 px-2 w-full bg-gray-100 text-gray-900 outline-none rounded-full overlofw-hidden" onChange={handleDivisionSelection} >
                    <option className='w-full' value="null" disabled >Division Selection</option>
                    <option className='w-full' value="division-1" >Division 1</option>
                    <option className='w-full' value="division-2" >Division 2</option>
                    <option className='w-full' value="division-3" >Division 3</option>
                </select>
            </div>
            <div className="mb-8 make-team flex w-full justify-between">
                <button onClick={handleOpenAdd} className="bg-yellow-500 text-gray-900 px-4 py-3 rounded-full flex justify-between gap-2 font-bold"><span><img src="/icons/plus.svg" alt="plus" className='w-6 svg-black' /></span>Add New Team</button>
                <button onClick={(e) => { if (importerEl.current) importerEl.current.showModal() }} className="bg-yellow-500 text-gray-900 px-4 py-3 rounded-full flex justify-between gap-2 font-bold"><span><img src="/icons/import.svg" alt="import" className='w-6 svg-black' /></span>Import File</button>
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
                {teamList.length > 0 && <TeamList eventId={eventId} teamList={teamList} />}
            </div>
        </div>
    )
}

export default TeamMain;