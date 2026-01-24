'use client'


import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { imgSize } from '@/utils/style';
import { useLdoId } from '@/lib/LdoProvider';
import { IGroupExpRel, IOption } from '@/types';
import GroupList from './GroupList';

interface IGroupAddSidebarProps {
    eventId: string;
    divisionList: IOption[];
    groupList: IGroupExpRel[];
}

function GroupAddSidebar({ eventId, divisionList, groupList }: IGroupAddSidebarProps) {

    const { ldoIdUrl } = useLdoId();

    const [currDivision, setCurrDivision] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleDivisionSelection = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setCurrDivision(inputEl.value.trim());
    };
    

    return (
        <React.Fragment>
            <aside
                className="lg:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg"
            >
                <h2 className="text-2xl font-semibold mb-4">Actions</h2>
                <Link
                    href={`/${eventId}/groups/new/${ldoIdUrl}`}
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
                    <SelectInput
                        key="division-select"
                        handleSelect={handleDivisionSelection}
                        defaultValue={currDivision}
                        name="division"
                        optionList={divisionList}
                    />
                </div>
            </aside>
            {/* Content Area */}
            <section
                className="lg:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg"
            >
                <h2 className="text-2xl font-semibold mb-6">Group List</h2>
                {groupList.length > 0 ? (
                    <GroupList currentDivision={currDivision} groupList={groupList} setIsLoading={setIsLoading} divisionList={divisionList} />
                ) : (
                    <p className="text-gray-300">No groups found for this division.</p>
                )}
            </section>
        </React.Fragment>
    );
}

export default GroupAddSidebar;