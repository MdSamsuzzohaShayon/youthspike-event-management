'use client'

import { motion } from 'framer-motion';
import { useLazyQuery } from '@apollo/client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamStandings from '@/components/teams/TeamStandings';
import { GET_TEAMS_AND_MATCHES } from '@/graphql/teams';
import { useError } from '@/lib/ErrorContext';
import { IEventExpRel, IGroup, IMatchExpRel, IOption, ITeam } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import { getUserFromCookie } from '@/utils/cookie';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';


interface ITeamStandingsPageProps {
    params: {
        eventId: string;
    };
}

function TeamStandingsPage({ params: { eventId } }: ITeamStandingsPageProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useUser();

    const { setActErr } = useError();
    const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
    const [divisionList, setDivisionList] = useState<IOption[]>([]);
    const [currDivision, setCurrDivision] = useState<string>('');
    const [teamList, setTeamList] = useState<ITeam[]>([]);
    const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
    const [matchList, setMatchList] = useState<IMatchExpRel[]>([]);
    const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupList, setGroupList] = useState<IGroup[]>([]);
    const [filteredGroupList, setFilteredGroupList] = useState<IGroup[]>([]);

    const [getEvent, { loading, error }] = useLazyQuery(GET_TEAMS_AND_MATCHES, { fetchPolicy: "network-only" });

    const fetchEvent = async () => {
        const eventResponse = await getEvent({ variables: { eventId }, fetchPolicy: 'network-only' });

        const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
        if (!success) return;

        const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
        setTeamList(newTeamList);
        let newFilteredList = [...newTeamList];
        if (eventResponse?.data?.getEvent?.data) setCurrEvent(eventResponse.data.getEvent.data);

        // Making divisions list
        const divisions = eventResponse?.data?.getEvent?.data?.divisions ? eventResponse?.data?.getEvent?.data?.divisions : '';
        const divs = divisionsToOptionList(divisions);
        setDivisionList(divs);

        const newGroupList: IGroup[] = eventResponse?.data?.getEvent?.data?.groups ? eventResponse?.data.getEvent.data.groups : [];
        let newFilteredGroupList: IGroup[] = [...newGroupList];
        setGroupList(newFilteredGroupList);

        const newMatchList: IMatchExpRel[] = eventResponse?.data?.getEvent?.data?.matches ? eventResponse?.data.getEvent.data.matches : [];

        // Division and team value
        removeTeamFromStore();
        const divisionExist = getDivisionFromStore();
        if (divisionExist) {
            setCurrDivision(divisionExist);
            newFilteredList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
            newFilteredGroupList = newGroupList.filter((g) => g.division && g.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
        }
        setFilteredGroupList(newFilteredGroupList);
        setFilteredTeamList(newTeamList);
        setMatchList(newMatchList)
    };

    const handleSelectGroup = (e: React.SyntheticEvent, groupId: string | null) => {
        e.preventDefault();
        setSelectedGroup(groupId ?? null);
        // filter team, matches
        if (groupId) {
            const tl = teamList?.filter((t) => t?.group?._id === groupId);
            setFilteredTeamList(tl || []);

            const groupTeamsIds = new Set<string>();
            tl?.forEach((t) => {
                groupTeamsIds.add(t._id);
            });
        } else {
            setFilteredTeamList(teamList || []);
        }
    };

    const handleDivisionChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        /**
         * Filter Matches and teams
         */
        const inputEl = e.target as HTMLInputElement;
        setCurrDivision(inputEl.value.trim());
        // If logged in as captain check me I the captain of one of the team or not
        let newTeamList = [...teamList];
        let newMatchList = [...matchList];
        let newGroupList = [...groupList];

        if (inputEl.value === '') {
            setFilteredTeamList([...teamList]);
            setFilteredMatchList([...newMatchList]);
            removeDivisionFromStore();
        } else {
            setDivisionToStore(inputEl.value.trim());
            newTeamList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
            setFilteredTeamList([...newTeamList]);

            newMatchList = newMatchList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
            setFilteredMatchList([...newMatchList]);

            newGroupList = newGroupList.filter((g) => g.division && g.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
            setFilteredGroupList(newGroupList);
        }
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
    }, [pathname, router, eventId, searchParams]);

    return (
        <div className="container mx-auto px-4 min-h-screen">
            <h1 className="mb-8 text-center">Roster</h1>
            {/* Event Menu Start */}
            <div className="event-and-menu bg-gray-800 p-8 rounded-lg shadow-lg">
                {currEvent && <CurrentEvent currEvent={currEvent} />}
                <div className="team-name text-center mt-4">
                    {(user && user.info?.team) && <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>}
                </div>
                <div className="navigator mt-4">
                    <UserMenuList eventId={eventId} />
                </div>
            </div>
            {/* Event Menu End */}
            <div className="w-full mb-4 p-4 bg-gray-800 rounded-md mt-8">
                <div className="w-full flex justify-center items-center">
                    <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" vertical extraCls="text-center w-full md:w-2/12" />
                </div>
                <div className="w-full flex justify-center items-center">
                    <SelectInput
                        handleSelect={(e) => handleSelectGroup(e, e.target?.value || null)}
                        name="group"
                        optionList={filteredGroupList.map((g) => ({ value: g._id, text: g.name }))}
                        lblTxt="Group"
                        vertical
                        extraCls="text-center w-full md:w-2/12"
                    />
                </div>
            </div>
            {/* <div className="group-select w-full flex flex-col lg:gap-4 bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
                <div className="division-selection w-full">
                    <SelectInput key={"matches-si-1"} lblTxt='Division' handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} vertical extraCls="text-center" />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-white text-center">Groups</h2>
                <motion.ul className="w-full flex flex-wrap justify-center gap-x-2 items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <motion.li
                        key="group-for-all"
                        role="presentation"
                        onClick={(e) => handleSelectGroup(e, null)}
                        className={`p-2 rounded-md cursor-pointer mb-2 text-center ${selectedGroup === null ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
                        whileHover={{ scale: 1.1 }}
                    >
                        All
                    </motion.li>
                    {filteredGroupList.map((group, index) => (
                        <motion.li
                            key={group?._id || index}
                            role="presentation"
                            onClick={(e) => handleSelectGroup(e, group?._id)}
                            className={`p-2 rounded-md cursor-pointer mb-2 text-center ${selectedGroup === group?._id ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
                            whileHover={{ scale: 1.1 }}
                        >
                            {group.name}
                        </motion.li>
                    ))}
                </motion.ul>
            </div> */}
            <div className="team-standings mt-8">
                <TeamStandings eventId={eventId} matchList={matchList} selectedGroup={selectedGroup} teamList={filteredTeamList} />
            </div>
        </div>
    )
}

export default TeamStandingsPage;