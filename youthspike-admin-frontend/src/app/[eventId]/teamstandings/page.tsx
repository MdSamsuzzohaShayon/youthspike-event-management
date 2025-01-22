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
import { IEventExpRel, IGroup, IMatchExpRel, ITeam } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { isValidObjectId } from '@/utils/helper';
import { getDivisionFromStore, removeTeamFromStore } from '@/utils/localStorage';


interface ITeamStandingsPageProps {
    params: {
        eventId: string;
    };
}

function TeamStandingsPage({ params: { eventId } }: ITeamStandingsPageProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { setActErr } = useError();
    const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
    const [currDivision, setCurrDivision] = useState<string>('');
    const [teamList, setTeamList] = useState<ITeam[]>([]);
    const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
    const [matchList, setMatchList] = useState<IMatchExpRel[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupList, setGroupList] = useState<IGroup[]>([]);

    const [getEvent, { loading, error }] = useLazyQuery(GET_TEAMS_AND_MATCHES, { fetchPolicy: "network-only" });

    const fetchEvent = async () => {
        const eventResponse = await getEvent({ variables: { eventId }, fetchPolicy: 'network-only' });

        const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
        if (!success) return;

        const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
        setTeamList(newTeamList);
        let newFilteredList = [...newTeamList];
        if (eventResponse?.data?.getEvent?.data) setCurrEvent(eventResponse.data.getEvent.data);

        const newGroupList: IGroup[] = eventResponse?.data?.getEvent?.data?.groups ? eventResponse?.data.getEvent.data.groups : [];
        let newFilteredGroupList: IGroup[] = [...newGroupList];

        const newMatchList: IMatchExpRel[] = eventResponse?.data?.getEvent?.data?.matches ? eventResponse?.data.getEvent.data.matches : [];

        // Division and team value
        removeTeamFromStore();
        const divisionExist = getDivisionFromStore();
        if (divisionExist) {
            setCurrDivision(divisionExist);
            newFilteredList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
            newFilteredGroupList = newGroupList.filter((g) => g.division && g.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
        }
        setGroupList(newFilteredGroupList);
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
                <div className="navigator mt-8">
                    <UserMenuList eventId={eventId} />
                </div>
            </div>
            {/* Event Menu End */}
            <div className="group-select w-full flex flex-col lg:gap-4 bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
                <h2 className="text-lg font-semibold mb-2 text-white text-center">Groups</h2>
                <motion.ul className="w-full flex flex-wrap justify-around items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <motion.li
                        key="group-for-all"
                        role="presentation"
                        onClick={(e) => handleSelectGroup(e, null)}
                        className={`p-2 rounded-md cursor-pointer mb-2 text-center ${selectedGroup === null ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
                        whileHover={{ scale: 1.1 }}
                    >
                        All
                    </motion.li>
                    {groupList.map((group, index) => (
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
            </div>
            <div className="team-standings mt-8">
                <TeamStandings matchList={matchList} selectedGroup={selectedGroup} teamList={filteredTeamList} />
            </div>
        </div>
    )
}

export default TeamStandingsPage;