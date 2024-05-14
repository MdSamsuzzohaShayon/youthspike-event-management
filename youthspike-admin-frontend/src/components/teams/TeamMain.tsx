/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_EVENT_WITH_TEAMS } from '@/graphql/teams';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IEventExpRel, IOption, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { usePathname, useRouter } from 'next/navigation';
import { handleResponse } from '@/utils/handleError';
import { GET_LDO } from '@/graphql/director';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import SelectInput from '../elements/forms/SelectInput';
import CurrentEvent from '../event/CurrentEvent';
import useClickOutside from '../../hooks/useClickOutside';
import UserMenuList from '../layout/UserMenuList';

interface ITeamsOfEventPage {
  eventId: string;
}

function TeamMain({ eventId }: ITeamsOfEventPage) {
  // Hooks
  const pathname = usePathname();
  const router = useRouter();

  // Local State
  const importerEl = useRef<HTMLDialogElement | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredList, setFilteredlist] = useState<ITeam[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');

  // GraphQL
  const [getEvent, { loading, error }] = useLazyQuery(GET_EVENT_WITH_TEAMS);
  const { data: ldoData, loading: ldoLoading } = useQuery(GET_LDO);

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    /**
     * Filter items
     */
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredlist([...teamList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const newList = teamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredlist([...newList]);
    }
  };

  const closeDialog = () => {
    if (importerEl.current) importerEl.current.close();
  };

  // Custom Hook
  useClickOutside(importerEl, () => {
    closeDialog();
  });

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeDialog();
  };

  // eslint-disable-next-line no-unused-vars
  const handleFilter = (e: React.SyntheticEvent, filteredItemId: number) => {
    e.preventDefault();
  };

  const fetchEvent = async () => {
    const eventResponse = await getEvent({ variables: { eventId }, fetchPolicy: 'network-only' });

    const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
    if (!success) return;

    const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
    let newFilteredList = [...newTeamList];
    if (eventResponse?.data?.getEvent?.data) setCurrEvent(eventResponse.data.getEvent.data);

    // Division and team value
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      newFilteredList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    setTeamList(newTeamList);
    setFilteredlist(newFilteredList);

    // Making divisions list
    const divisions = eventResponse?.data?.getEvent?.data?.divisions ? eventResponse?.data?.getEvent?.data?.divisions : [];
    const divs = divisionsToOptionList(divisions);
    setDivisionList(divs);
  };

  const fefetchFunc = async () => {
    await fetchEvent();
  };

  // Do this for all event pages
  useEffect(() => {
    if (eventId) {
      if (isValidObjectId(eventId)) {
        fetchEvent();
      } else {
        setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [pathname, router, eventId]);

  if (loading || isLoading || ldoLoading) return <Loader />;
  const eventList = ldoData?.getEventDirector?.data?.events;

  return (
    <div className="TeamMain">
      <dialog ref={importerEl}>
        <div className="w-full flex justify-end items-center">
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" alt="close" className="w-6 svg-white" role="presentation" onClick={handleClose} />
        </div>
        <MultiPlayerAdd eventId={eventId} setIsLoading={setIsLoading} closeDialog={closeDialog} setActErr={setActErr} divisionList={divisionList} />
      </dialog>
      <h1 className="text-center mb-4">Teams</h1>
      {currEvent && <CurrentEvent currEvent={currEvent} />}
      <div className="navigator mb-4">
        <UserMenuList eventId={eventId} />
      </div>
      <div className="mb-4 division-selection w-full">
        <SelectInput key={crypto.randomUUID()} handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} vertical extraCls="text-center" />
      </div>

      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <div className="mb-8 make-team flex w-full justify-between">
        <Link className="btn-info flex justify-between items-center gap-2 text-gray-900" href={`/${eventId}/teams/new`}>
          <span>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/plus.svg" alt="plus" className="w-6 svg-black" />
          </span>
          Add New Team
        </Link>
        <button
          type="button"
          onClick={() => {
            if (importerEl.current) importerEl.current.showModal();
          }}
          className="btn-info flex justify-between items-center gap-2"
        >
          <span>
            <Image width={imgSize.logo} height={imgSize.logo} alt="import-icon" src="/icons/import.svg" className="w-6 svg-black" />
          </span>
          Import File
        </button>
      </div>
      <div className="list-with-filter w-full relative">
        <div className="action-section flex justify-between mb-4">
          <div className="input-group flex items-center gap-2 justify-between">
            <input type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>
          <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
            <p>A-Z</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>
          <ul className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
            <li role="presentation" onClick={(e) => handleFilter(e, 1)}>
              Copy
            </li>
            <li role="presentation" onClick={(e) => handleFilter(e, 2)}>
              Edit
            </li>
          </ul>
        </div>
        {filteredList.length > 0 && <TeamList eventId={eventId} teamList={filteredList} eventList={eventList} setIsLoading={setIsLoading} fefetchFunc={fefetchFunc} />}
      </div>
    </div>
  );
}

export default TeamMain;
