'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamStandings from '@/components/teams/TeamStandings';
import SelectInput from '@/components/elements/forms/SelectInput';
import Pagination from '@/components/elements/Pagination';

import { IEventExpRel, IGroup, IMatchExpRel, IOption, ITeam } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';

interface ITeamStandingsMainProps {
  eventData: IEventExpRel;
}

const ITEMS_PER_PAGE = 40;

function TeamStandingsMain({ eventData }: ITeamStandingsMainProps) {
  /* ---------- primitive state ---------- */
  const [currDivision, setCurrDivision] = useState<string | null>();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  /* ---------- base, never‑changing lists ---------- */
  const teamList = eventData?.teams ?? [];
  const groupList = eventData?.groups ?? [];
  const matchList = (eventData?.matches ?? []) as IMatchExpRel[];

  /* ---------- static options ---------- */
  const divisionList: IOption[] = useMemo(() => divisionsToOptionList(eventData?.divisions ?? ''), [eventData]);

  /* ---------- derived, memoised filters ---------- */
  const filteredGroupList: IGroup[] = useMemo(() => {
    if (!currDivision) return groupList;
    const d = currDivision.toLowerCase();
    return groupList.filter((g) => g.division?.trim().toLowerCase() === d);
  }, [groupList, currDivision]);

  const filteredTeamList: ITeam[] = useMemo(() => {
    let list = teamList;

    if (currDivision) {
      const d = currDivision.toLowerCase();
      list = list.filter((t) => t.division?.trim().toLowerCase() === d);
    }

    if (selectedGroup) {
      list = list.filter((t) => (typeof t.group === 'object' ? t.group?._id : t.group) === selectedGroup);
    }
    return list;
  }, [teamList, currDivision, selectedGroup]);

  /* ---------- pagination ---------- */
  const paginatedTeamList: ITeam[] = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTeamList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTeamList, currentPage]);

  /* ---------- handlers ---------- */
  const handleDivisionChange = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    const division = (e.target as HTMLInputElement).value.trim();
    setCurrDivision(division);
    setCurrentPage(1); // reset pagination

    if (division) {
      SessionStorageService.setItem(DIVISION, division);
    } else {
      SessionStorageService.removeItem(DIVISION);
    }
  }, []);

  const handleSelectGroup = useCallback((e: React.SyntheticEvent, groupId: string | null) => {
    e.preventDefault();
    setSelectedGroup(groupId);
    setCurrentPage(1); // reset pagination
  }, []);

  useEffect(() => {
    const divisionExist = SessionStorageService.getItem(DIVISION) || '';
    if (divisionExist) {
      setCurrDivision(divisionExist as string);
    }
  }, []);

  /* ---------- render ---------- */
  return (
    <>
      <div className="event-and-menu">
        <CurrentEvent currEvent={eventData} />
        <div className="navigator mt-4">{eventData._id && <UserMenuList eventId={eventData._id} />}</div>
      </div>

      <div className="w-full mb-4 p-4 bg-gray-800 rounded-xl mt-8 flex flex-col md:flex-row gap-6">
        <div className="w-full flex justify-center items-center">
          <SelectInput key="d-i-1" handleSelect={handleDivisionChange} name="division" optionList={divisionList} label="Division" className="w-full" />
        </div>

        <div className="w-full flex justify-center items-center">
          <SelectInput
            key="g-i-1"
            className="w-full"
            // @ts-ignore – SelectInput passes event + value
            handleSelect={(e) => handleSelectGroup(e, e.target?.value || null)}
            name="group"
            optionList={filteredGroupList.map((g, i) => ({
              id: i + 1,
              value: g._id,
              text: g.name,
            }))}
            label="Group"
          />
        </div>
      </div>

      <div className="team-standings mt-8">
        <TeamStandings eventId={eventData._id} matchList={matchList} selectedGroup={selectedGroup} teamList={paginatedTeamList} />
      </div>

      <div className="w-full">
        <Pagination currentPage={currentPage} itemList={filteredTeamList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
      </div>
    </>
  );
}

export default TeamStandingsMain;
