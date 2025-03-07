'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamStandings from '@/components/teams/TeamStandings';
import { IEventExpRel, IGroup, IMatchExpRel, IOption, ITeam } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import Pagination from '../elements/Pagination';


interface ITeamStandingsMainProps {
    eventData: IEventExpRel;
}

const ITEMS_PER_PAGE = 40;

function TeamStandingsMain({ eventData }: ITeamStandingsMainProps) {

    const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
    const [divisionList, setDivisionList] = useState<IOption[]>([]);
    const [currDivision, setCurrDivision] = useState<string>('');
    const [teamList, setTeamList] = useState<ITeam[]>([]);
    const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
    const [matchList, setMatchList] = useState<IMatchExpRel[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupList, setGroupList] = useState<IGroup[]>([]);
    const [filteredGroupList, setFilteredGroupList] = useState<IGroup[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Filter teams, matches, and groups by division
    const filterDataByDivision = (division: string, newTeamList: ITeam[], newGroupList: IGroup[], newMatchList: IMatchExpRel[]) => {
        const divisionLowerCase = division.trim().toLowerCase();
        const filteredTeams = newTeamList.filter((t) => t.division?.trim().toLowerCase() === divisionLowerCase);
        const filteredGroups = newGroupList.filter((g) => g.division?.trim().toLowerCase() === divisionLowerCase);
        const filteredMatches = newMatchList.filter((m) => m.division?.trim().toLowerCase() === divisionLowerCase);

        setFilteredTeamList(filteredTeams);
        setFilteredGroupList(filteredGroups);
    };

    // Handle selection change for group
    const handleSelectGroup = (e: React.SyntheticEvent, groupId: string | null) => {
        e.preventDefault();
        setSelectedGroup(groupId ?? null);
        if (groupId) {
            const filteredTeams = teamList.filter((t) => t.group?._id === groupId);
            setFilteredTeamList(filteredTeams);
        } else {
            setFilteredTeamList(teamList);
        }
    };

    // Handle division change
    const handleDivisionChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        const division = inputEl.value.trim();
        setCurrDivision(division);

        if (division === '') {
            removeDivisionFromStore();
            setFilteredTeamList(teamList);
            setFilteredGroupList(groupList);
        } else {
            setDivisionToStore(division);
            filterDataByDivision(division, teamList, groupList, matchList);
        }
    };

    // Fetch event when component mounts or eventId changes
    useEffect(() => {
        const newTeamList: ITeam[] = eventData?.teams || [];
        setTeamList(newTeamList);

        const divisions = eventData?.divisions || '';
        const divs = divisionsToOptionList(divisions);
        setDivisionList(divs);

        const newGroupList: IGroup[] = eventData?.groups || [];
        setGroupList(newGroupList);

        // @ts-ignore
        const newMatchList: IMatchExpRel[] = eventData?.matches || [];
        setMatchList(newMatchList);

        // Filter teams based on stored division value
        const divisionExist = getDivisionFromStore();
        if (divisionExist) {
            setCurrDivision(divisionExist);
            filterDataByDivision(divisionExist, newTeamList, newGroupList, newMatchList);
        } else {
            setFilteredGroupList(newGroupList);
            setFilteredTeamList(newTeamList);
        }

        setCurrEvent(eventData);
    }, [eventData]);


      const paginatedTeamList: ITeam[] = useMemo(() => {
        // Paginated
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedTeams = filteredTeamList.slice(start, start + ITEMS_PER_PAGE);
    
        // inactive players won't have rankings
        return paginatedTeams;
      }, [filteredTeamList, currentPage]);

      console.log({paginatedTeamList});
      

    return (
        <React.Fragment>
            <div className="event-and-menu p-8 rounded-lg shadow-lg">
                {currEvent && <CurrentEvent currEvent={currEvent} />}
                <div className="navigator mt-4">
                    {currEvent?._id && <UserMenuList eventId={currEvent?._id} />}
                </div>
            </div>
            <div className="w-full mb-4 p-4 bg-gray-800 rounded-md mt-8">
                <div className="w-full flex justify-center items-center">
                    <SelectInput key="d-i-1" handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" vertical
                        extraCls="text-center w-full lg:w-2/12" />
                </div>
                <div className="w-full flex justify-center items-center">
                    <SelectInput
                        // @ts-ignore
                        handleSelect={(e) => handleSelectGroup(e, e.target?.value || null)}
                        key="g-i-1"
                        name="group"
                        defaultTxt='Overall'
                        optionList={filteredGroupList.map((g) => ({ value: g._id, text: g.name }))}
                        lblTxt="Group"
                        vertical
                        extraCls="text-center w-full lg:w-2/12"
                    />
                </div>
            </div>
            <div className="team-standings mt-8">
                <TeamStandings eventId={eventData._id} matchList={matchList} selectedGroup={selectedGroup} teamList={paginatedTeamList} />
            </div>
            <div className="w-full">
                <Pagination currentPage={currentPage} itemList={filteredTeamList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
            </div>
        </React.Fragment>
    )
}

export default TeamStandingsMain;
