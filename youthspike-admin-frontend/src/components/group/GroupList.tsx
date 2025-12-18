import { IGroupExpRel, IOption } from '@/types';
import React, { useMemo } from 'react';
import GroupCard from './GroupCard';

interface IGroupListProps {
    currDivision: string;
    groupList: IGroupExpRel[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    divisionList: IOption[];
}

function GroupList({ currDivision, groupList, divisionList, setIsLoading }: IGroupListProps) {

    const filteredGroupList: IGroupExpRel[] = useMemo(()=>{
        if(!currDivision || currDivision === '') return groupList;
        return groupList.filter((g)=> g.division.trim().toUpperCase() === currDivision.trim().toUpperCase());
    }, [groupList, currDivision]);

    return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroupList.map((group) => (
                <GroupCard key={group._id} group={group} setIsLoading={setIsLoading} divisionList={divisionList} />
            ))}
        </div>
    );
}

export default GroupList;
