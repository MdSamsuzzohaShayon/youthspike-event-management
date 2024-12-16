import { IGroup, IGroupExpRel, IOption } from '@/types';
import React, { useEffect, useState } from 'react';
import GroupCard from './GroupCard';
import { ApolloQueryResult, OperationVariables, RefetchQueriesFunction } from '@apollo/client';

interface IGroupListProps {
    currDivision: string;
    groupList: IGroupExpRel[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    divisionList: IOption[];
    refetch?: (variables?: Partial<OperationVariables> | undefined) => Promise<ApolloQueryResult<any>>;
}

function GroupList({ currDivision, groupList, divisionList, setIsLoading, refetch }: IGroupListProps) {
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
                <GroupCard key={group._id} group={group} setIsLoading={setIsLoading} divisionList={divisionList} refetch={refetch} />
            ))}
        </div>
    );
}

export default GroupList;
