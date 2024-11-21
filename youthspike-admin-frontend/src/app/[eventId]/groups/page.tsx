'use client';

import SelectInput from '@/components/elements/forms/SelectInput';
import GroupList from '@/components/group/GroupList';
import { GET_GROUPS } from '@/graphql/group';
import { useLdoId } from '@/lib/LdoProvider';
import { IGroup, IGroupExpRel } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { imgSize } from '@/utils/style';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserMenuList from '@/components/layout/UserMenuList';

interface IGroupsPageProps {
    params: {
        eventId: string;
    };
}

function GroupsPage({ params }: IGroupsPageProps) {
    const { ldoIdUrl } = useLdoId();

    const { data } = useQuery(GET_GROUPS, {
        variables: { eventId: params.eventId },
        fetchPolicy: 'network-only',
    });
    const [currDivision, setCurrDivision] = useState<string>('');

    const handleDivisionSelection = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setCurrDivision(inputEl.value.trim());
    };

    const eventExist = data?.getEvent?.data;
    const groupList: IGroupExpRel[] = data?.getEvent?.data?.groups || [];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-800 py-6 shadow-lg"
            >
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Groups</h1>
                    <p className="text-lg md:text-xl text-gray-300">
                        Organize and manage groups with ease. Select a division to get started.
                    </p>
                </div>
            </motion.header>

            <div className="navigator my-6">
                <UserMenuList eventId={params.eventId} />
            </div>

            <main className="container mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10">
                {/* Sidebar */}
                <motion.aside
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg"
                >
                    <h2 className="text-2xl font-semibold mb-4">Actions</h2>
                    <Link
                        href={`/${params.eventId}/groups/new/${ldoIdUrl}`}
                        className="flex items-center gap-3 bg-yellow-logo text-black py-3 px-4 rounded-lg transition-all text-lg font-medium"
                    >
                        <Image
                            width={imgSize.logo}
                            height={imgSize.logo}
                            src="/icons/plus.svg"
                            alt="plus"
                            className="w-6 h-6"
                        />
                        Add New Group
                    </Link>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">Select Division</h3>
                        <SelectInput
                            key="division-select"
                            handleSelect={handleDivisionSelection}
                            defaultValue={currDivision}
                            name="division"
                            optionList={eventExist ? divisionsToOptionList(eventExist.divisions) : []}
                            vertical={false}
                            extraCls="w-full"
                            rw="w-full"
                        />
                    </div>
                </motion.aside>

                {/* Content Area */}
                <motion.section
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg"
                >
                    <h2 className="text-2xl font-semibold mb-6">Group List</h2>
                    {groupList.length > 0 ? (
                        <GroupList currDivision={currDivision} groupList={groupList} />
                    ) : (
                        <p className="text-gray-300">No groups found for this division.</p>
                    )}
                </motion.section>
            </main>
        </div>
    );
}

export default GroupsPage;
