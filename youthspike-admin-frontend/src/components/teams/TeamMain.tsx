/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Loader from '@/components/elements/Loader';

import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList } from '@/utils/helper';
import { IEventExpRel, IGroup, IGroupExpRel, IOption, IPlayerExpRel, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CurrentEvent from '../event/CurrentEvent';
import useClickOutside from '../../hooks/useClickOutside';
import UserMenuList from '../layout/UserMenuList';
import { useLdoId } from '@/lib/LdoProvider';
import SelectGeneralInput from '../elements/forms/SelectGeneralInput';

interface IEventDetail {
  event: IEventExpRel;
  teams: ITeam[];
  groups: IGroupExpRel[];
  players: IPlayerExpRel[];
}

interface ITeamsOfEventPage {
  eventDetail: IEventDetail;
}

function TeamMain({ eventDetail }: ITeamsOfEventPage) {
  // Hooks
  const pathname = usePathname();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const searchParams = useSearchParams();

  // Local State
  const importerEl = useRef<HTMLDialogElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [groupList, setGroupList] = useState<IGroup[]>([]);
  const [filteredGroupList, setFilteredGroupList] = useState<IGroup[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [currDivision, setCurrDivision] = useState<string>('');

  // GraphQL

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    /**
     * Filter items
     */
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredTeamList([...teamList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const newList = teamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      const newGroupList = groupList.filter((g) => g.division && g.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredTeamList([...newList]);
      setFilteredGroupList(newGroupList);
    }
  };

  const closeDialog = () => {
    if (importerEl.current) importerEl.current.close();
  };

  // Custom Hook
  // useClickOutside(importerEl, () => {
  //   closeDialog();
  // });

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeDialog();
  };

  const fetchEvent = async () => {
    const newTeamList: ITeam[] = eventDetail?.teams ? eventDetail.teams : [];
    let newFilteredList = [...newTeamList];

    const newGroupList: IGroup[] = eventDetail?.groups ? eventDetail.groups : [];
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
    setFilteredTeamList(newFilteredList);
    setGroupList(newGroupList);
    setFilteredGroupList(newFilteredGroupList);

    // Making divisions list
    const divisions = eventDetail.event?.divisions ? eventDetail.event?.divisions : [];
    // @ts-ignore
    const divs = divisionsToOptionList(divisions);
    setDivisionList(divs);
  };

  const fefetchFunc = async () => {
    // await fetchEvent();
    window.location.reload();
  };

  // Do this for all event pages
  useEffect(() => {
    fetchEvent();
  }, [pathname, router, eventDetail, searchParams]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <dialog ref={importerEl} className="modal-dialog">
        <div className="p-4">
          <div className="flex justify-end">
            <button type="button" className="bg-transparent text-white" onClick={() => importerEl.current?.close()}>
              ✖
            </button>
          </div>
          <MultiPlayerAdd eventId={eventDetail.event._id} setIsLoading={setIsLoading} closeDialog={() => importerEl.current?.close()} divisionList={divisionList} />
        </div>
      </dialog>

      {/* Event Menu Start */}
      <div className="event-and-menu">
        {eventDetail?.event && <CurrentEvent currEvent={eventDetail.event} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={eventDetail.event._id} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mb-4">
        <SelectGeneralInput defaultTxt="Select a division" handleSelect={handleDivisionSelection} name="division" optionList={divisionList} />
      </div>

      <div className="actions flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <Link href={`/${eventDetail.event._id}/teams/new/${ldoIdUrl}`} className="btn-info text-center">
          Add New Team
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            importerEl.current?.showModal();
          }}
          className="btn-info text-center"
        >
          Import Teams
        </button>
      </div>

      {filteredTeamList.length > 0 ? (
        <TeamList groupList={filteredGroupList} eventId={eventDetail.event._id} teamList={filteredTeamList} setIsLoading={setIsLoading} fefetchFunc={fefetchFunc} />
      ) : (
        <p className="text-center text-gray-400">No teams available.</p>
      )}
    </React.Fragment>
  );
}

export default TeamMain;
