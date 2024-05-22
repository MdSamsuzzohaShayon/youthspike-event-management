import React, { useState } from 'react';
import { IError, IEvent, ITeam } from '@/types';
import TeamCard from './TeamCard';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError, handleResponse } from '@/utils/handleError';
import { useMutation } from '@apollo/client';
import { DELETE_MULTIPLE_TEAMS } from '@/graphql/teams';

interface TeamListProps {
  eventId: string;
  teamList: ITeam[];
  eventList?: IEvent[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  fefetchFunc?: () => Promise<void>;
}

function TeamList({ teamList, eventId, eventList, setIsLoading, setActErr, fefetchFunc }: TeamListProps) {

  const [bulkTeams, setBulkTeams] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showBulkAction, setShowBulkAction] = useState<boolean>(false);
  const [deleteMultipleTeams] = useMutation(DELETE_MULTIPLE_TEAMS);

  // eslint-disable-next-line no-unused-vars
  const handleFilter = (e: React.SyntheticEvent, filteredItemId: number) => {
    e.preventDefault();
  };

  // ===== Bulk Actions =====
  const handleCheckedTeam = (e: React.SyntheticEvent, teamId: string) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.checked) {
      // @ts-ignore
      setBulkTeams((prevState) => ([...new Set([...prevState, teamId])]));
    } else {
      setBulkTeams((prevState) => prevState.filter((t) => t !== teamId));
    }
  }

  const handleShowBulk = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setShowBulkAction(!showBulkAction);
  }

  const handleBulkDelete = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if(bulkTeams.length <= 0) return;
    try {
      setIsLoading(true);
      const response = await deleteMultipleTeams({variables: {teamIds: bulkTeams}});
      const success = await handleResponse({response: response.data.deleteTeams, setActErr});
      if(success && fefetchFunc) await fefetchFunc();

    } catch (error: any) {
      handleError({error, setActErr});
    }finally{
      setIsLoading(false);
    }

  }

  const handleBulkCredentials= (e: React.SyntheticEvent) => {
    e.preventDefault();
    
  }

  return (
    <div className="team-list w-full">
      <div className="action-section flex justify-between mb-4">
        <div className="input-group flex items-center gap-2 justify-between">
          <input type="checkbox" name="bulkaction" id="bulk-action" />
          <label htmlFor="bulk-action">Bulk Action</label>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role='presentation' onClick={handleShowBulk} />
        </div>
        <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
          <p>A-Z</p>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
        </div>

        {/* Filter Action Start  */}
        <ul className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
          <li role="presentation" className='capitalize' onClick={(e) => handleFilter(e, 1)}>
            Copy
          </li>
          <li role="presentation" className='capitalize' onClick={(e) => handleFilter(e, 2)}>
            Edit
          </li>
        </ul>
        {/* Filter Action End  */}

        {/* Bulk Action start  */}
        <ul className={`${showBulkAction ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
          <li role="presentation" className='capitalize' onClick={handleBulkDelete}>
            delete
          </li>

          <li role="presentation" className='capitalize' onClick={handleBulkCredentials}>
            Send Credentials
          </li>
        </ul>
        {/* Bulk Action end  */}


      </div>
      <div className="team-list-card flex flex-col justify-between items-center gap-3">
        {teamList.map((team) => (
          <TeamCard key={team._id} team={team} eventId={eventId} eventList={eventList || []} setIsLoading={setIsLoading} fefetchFunc={fefetchFunc} handleCheckedTeam={handleCheckedTeam} />
        ))}
      </div>
    </div>
  );
}

export default TeamList;
