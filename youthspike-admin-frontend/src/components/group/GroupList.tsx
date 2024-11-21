import { IGroup, IGroupExpRel } from '@/types';
import React, { useEffect, useState } from 'react';
import GroupCard from './GroupCard';

interface IGroupListProps {
    currDivision: string;
    groupList: IGroupExpRel[];
}

function GroupList({ currDivision, groupList }: IGroupListProps) {
    const [filteredGroupList, setFilteredGroupList] = useState<IGroupExpRel[]>([]);

    useEffect(()=>{
        if(currDivision && currDivision !== ''){
            setFilteredGroupList(groupList.filter((g)=> g.division.trim().toUpperCase() === currDivision.trim().toUpperCase()));
        }else{
            setFilteredGroupList(groupList);
        }
    }, [currDivision]);

    useEffect(() => {
        if (groupList && groupList.length > 0) setFilteredGroupList(groupList);
    }, [groupList]);

    return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroupList.map((group) => (
                <GroupCard key={group._id} group={group} />
            ))}
        </div>
    );
}

export default GroupList;
