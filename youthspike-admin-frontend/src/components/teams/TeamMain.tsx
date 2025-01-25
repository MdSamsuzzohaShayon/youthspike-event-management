/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_EVENT_WITH_TEAMS } from '@/graphql/teams';
import Loader from '@/components/elements/Loader';

import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IEvent, IEventExpRel, IGroup, IOption, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { handleResponse } from '@/utils/handleError';
import { GET_LDO_EVENTS_LIGHT } from '@/graphql/director';
import SelectInput from '../elements/forms/SelectInput';
import CurrentEvent from '../event/CurrentEvent';
import useClickOutside from '../../hooks/useClickOutside';
import UserMenuList from '../layout/UserMenuList';
import { getUserFromCookie } from '@/utils/cookie';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { motion } from 'framer-motion';
import { useError } from '@/lib/ErrorContext';

interface ITeamsOfEventPage {
  eventId: string;
}

function TeamMain({ eventId }: ITeamsOfEventPage) {
  // Hooks
  const pathname = usePathname();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();
  const searchParams = useSearchParams()

  // Local State
  const importerEl = useRef<HTMLDialogElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [groupList, setGroupList] = useState<IGroup[]>([]);
  const [filteredGroupList, setFilteredGroupList] = useState<IGroup[]>([]);
  const [filteredList, setFilteredlist] = useState<ITeam[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');


  // GraphQL
  const [getEvent, { loading, error }] = useLazyQuery(GET_EVENT_WITH_TEAMS, { fetchPolicy: "network-only" });
  const [getLdo, { loading: ldoLoading }] = useLazyQuery(GET_LDO_EVENTS_LIGHT, { fetchPolicy: "network-only" });

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
      const newGroupList = groupList.filter((g) => g.division && g.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredlist([...newList]);
      setFilteredGroupList(newGroupList);
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



  const fetchEvent = async () => {
    const eventResponse = await getEvent({ variables: { eventId }, fetchPolicy: 'network-only' });

    const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
    if (!success) return;

    const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
    let newFilteredList = [...newTeamList];
    if (eventResponse?.data?.getEvent?.data) setCurrEvent(eventResponse.data.getEvent.data);

    const newGroupList: IGroup[] = eventResponse?.data?.getEvent?.data?.groups ? eventResponse?.data.getEvent.data.groups : [];
    let newFilteredGroupList: IGroup[] = [...newGroupList];

    // Division and team value
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      newFilteredList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      newFilteredGroupList = newGroupList.filter((g) => g.division && g.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    setTeamList(newTeamList);
    setFilteredlist(newFilteredList);
    setGroupList(newGroupList);
    setFilteredGroupList(newFilteredGroupList);

    // Making divisions list
    const divisions = eventResponse?.data?.getEvent?.data?.divisions ? eventResponse?.data?.getEvent?.data?.divisions : [];
    const divs = divisionsToOptionList(divisions);
    setDivisionList(divs);

  };

  const fetchLDO = async () => {
    // Fetch LDO if there is LDO id
    const instantUser = getUserFromCookie();
    if (instantUser && instantUser.info && instantUser.token) {
      let directorId = null;
      if (instantUser.info.role === UserRole.admin) {
        directorId = searchParams.get('ldoId');
      } else if (instantUser.info.role === UserRole.director) {
        directorId = instantUser.info._id;
      }
      if (directorId) {
        const ldoRes = await getLdo({ variables: { dId: directorId } });
        if (ldoRes?.data?.getEventDirector?.data?.events) {
          // setEventList(ldoRes.data.getEventDirector.data.events)
        }

      }
    }
  }

  const fefetchFunc = async () => {
    await fetchEvent();
  };




  // Do this for all event pages
  useEffect(() => {
    if (eventId) {
      if (isValidObjectId(eventId)) {
        fetchEvent();
        fetchLDO();
      } else {
        setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [pathname, router, eventId, searchParams]);



  if (loading || isLoading || ldoLoading) return <Loader />;




  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="team-main container mx-auto px-4 py-6"
    >
      <dialog ref={importerEl} className="p-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            className="bg-transparent text-white"
            onClick={() => importerEl.current?.close()}
          >
            ✖
          </button>
        </div>
        <MultiPlayerAdd
          eventId={eventId}
          setIsLoading={setIsLoading}
          closeDialog={() => importerEl.current?.close()}
          divisionList={divisionList}
        />
      </dialog>

      <h1 className="text-4xl font-bold text-center text-white mb-6">Team Management</h1>
      {/* Event Menu Start */}
      <div className="event-and-menu p-8 rounded-lg shadow-lg">
        {currEvent && <CurrentEvent currEvent={currEvent} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={eventId} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mb-4">
        <SelectInput
          handleSelect={handleDivisionSelection}
          value={currDivision}
          name="division"
          optionList={divisionList}
          vertical
          extraCls="w-full bg-gray-700 text-white"
        />
      </div>

      <div className="actions flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <Link href={`/${eventId}/teams/new/${ldoIdUrl}`} className="btn-info text-center">
          Add New Team
        </Link>
        <button
          onClick={() => importerEl.current?.showModal()}
          className="btn-info text-center"
        >
          Import Teams
        </button>
      </div>

      {filteredList.length > 0 ? (
        <TeamList
          groupList={filteredGroupList}
          eventId={eventId}
          teamList={filteredList}
          setIsLoading={setIsLoading}
          fefetchFunc={fefetchFunc}
        />
      ) : (
        <p className="text-center text-gray-400">No teams available.</p>
      )}
    </motion.div>
  );
}

export default TeamMain;
