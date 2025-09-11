/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import TeamList from '@/components/teams/TeamList';
import { divisionsToOptionList } from '@/utils/helper';
import { IEventExpRel, IGroup, IGroupExpRel, IOption, IPlayerExpRel, ITeam } from '@/types';
import MultiPlayerAdd from '@/components/player/MultiPlayerAdd';
import Link from 'next/link';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CurrentEvent from '../event/CurrentEvent';
import UserMenuList from '../layout/UserMenuList';
import { useLdoId } from '@/lib/LdoProvider';
import SelectGeneralInput from '../elements/forms/SelectGeneralInput';
import MultiPlayerAddDialog from './MultiPlayerAddDialog';

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
  const { ldoIdUrl } = useLdoId();
  const searchParams = useSearchParams();

  // Refs
  const importerEl = useRef<HTMLDialogElement | null>(null);

  // Local State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');

  // Memoized derived state
  const divisionList = useMemo(() => {
    const divisions = eventDetail.event?.divisions || "";
    return divisionsToOptionList(divisions);
  }, [eventDetail.event?.divisions]);

  const playerMap = useMemo(()=> {
    const map = new Map(eventDetail.players.map((p)=> [p._id, p]));
    return map;
  }, [eventDetail, eventDetail?.players]);

console.log(eventDetail.players);


  const teamList = useMemo(() => {
    const newTl = (eventDetail?.teams || []);
    const tl = [];
    for (let i = 0; i < newTl.length; i+=1) {
      const tlObj = {...newTl[i]};
      if(tlObj.captain){
        tlObj.captain = playerMap.get(String(tlObj.captain)) || null;
      }
      tl.push(tlObj);
    }
    return tl;
  }, [eventDetail?.teams, playerMap]);
  const groupList = useMemo(() => eventDetail?.groups || [], [eventDetail?.groups]);



  const filteredTeamList = useMemo(() => {
    if (!currDivision) {
      return teamList.slice().sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    }
    
    return teamList
      .filter((t) => 
        t.division && t.division.trim().toLowerCase() === currDivision.trim().toLowerCase()
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamList, currDivision]);

  const filteredGroupList = useMemo(() => {
    if (!currDivision) return groupList;
    return groupList.filter((g) => 
      g.division && g.division.trim().toLowerCase() === currDivision.trim().toLowerCase()
    );
  }, [groupList, currDivision]);

  // Event handlers
  const handleDivisionSelection = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    const divisionValue = inputEl.value.trim();
    
    setCurrDivision(divisionValue);
    
    if (divisionValue === '') {
      removeDivisionFromStore();
    } else {
      setDivisionToStore(divisionValue);
    }
  }, []);

  const closeDialog = useCallback(() => {
    importerEl.current?.close();
  }, []);

  const handleClose = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    closeDialog();
  }, [closeDialog]);

  const fefetchFunc = useCallback( () => {
    window.location.reload();
  }, []);

  // Initialization effect
  useEffect(() => {
    const initializeComponent = () => {
      removeTeamFromStore();
      const divisionExist = getDivisionFromStore();
      if (divisionExist) {
        setCurrDivision(divisionExist);
      }
    };

    initializeComponent();
  }, []);

  // Effect to handle URL changes
  useEffect(() => {
    // This effect can respond to URL changes if needed
    // Currently it just re-runs initialization when dependencies change
    const divisionExist = getDivisionFromStore();
    if (divisionExist && divisionExist !== currDivision) {
      setCurrDivision(divisionExist);
    }
  }, [pathname, searchParams, currDivision]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <MultiPlayerAddDialog divisionList={divisionList} eventId={eventDetail.event._id} importerEl={importerEl} setIsLoading={setIsLoading} />

      {/* Event Menu Start */}
      <div className="event-and-menu">
        {eventDetail?.event && <CurrentEvent currEvent={eventDetail.event} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={eventDetail.event._id} />
        </div>
      </div>
      {/* Event Menu End */}

      <div className="mb-4">
        <SelectGeneralInput 
          defaultTxt="Select a division" 
          handleSelect={handleDivisionSelection} 
          name="division" 
          optionList={divisionList} 
        />
      </div>

      <div className="actions flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <Link 
          href={`/${eventDetail.event._id}/teams/new/${ldoIdUrl}`} 
          className="btn-info text-center"
        >
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
        <TeamList 
          groupList={filteredGroupList} 
          eventId={eventDetail.event._id} 
          teamList={filteredTeamList} 
          setIsLoading={setIsLoading} 
          fefetchFunc={fefetchFunc} 
        />
      ) : (
        <p className="text-center text-gray-400">No teams available.</p>
      )}
    </React.Fragment>
  );
}

export default TeamMain;