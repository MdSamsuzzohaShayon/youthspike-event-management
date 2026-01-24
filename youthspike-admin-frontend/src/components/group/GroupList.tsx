// ============================================================================
// GroupList.tsx
// ============================================================================
import { IGroupExpRel, IOption } from '@/types';
import React, { useMemo } from 'react';
import GroupCard from './GroupCard';

interface IGroupListProps {
  currentDivision: string;
  groupList: IGroupExpRel[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList: IOption[];
}

function GroupList({ 
  currentDivision, 
  groupList, 
  divisionList, 
  setIsLoading 
}: IGroupListProps) {
  const filteredGroupList = useMemo(() => {
    if (!currentDivision) return groupList;
    
    const normalizedDivision = currentDivision.trim().toUpperCase();
    return groupList.filter(
      (group) => group.division.trim().toUpperCase() === normalizedDivision
    );
  }, [groupList, currentDivision]);

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {filteredGroupList.map((group) => (
        <GroupCard 
          key={group._id} 
          group={group} 
          setIsLoading={setIsLoading} 
          divisionList={divisionList} 
        />
      ))}
    </div>
  );
}

export default GroupList;
