import React, { useRef, useState } from 'react';
import { ICheckedInput, IError, IEvent, IGroup, ITeam } from '@/types';
import TeamCard from './TeamCard';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError, handleResponse } from '@/utils/handleError';
import { useMutation } from '@apollo/client';
import { DELETE_MULTIPLE_TEAMS } from '@/graphql/teams';
import { SEND_CREDENTIALS } from '@/graphql/event';

interface TeamListProps {
  eventId: string;
  teamList: ITeam[];
  groupList: IGroup[];
  eventList?: IEvent[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  fefetchFunc?: () => Promise<void>;
}


function TeamList({ teamList, groupList, eventId, eventList, setIsLoading, setActErr, fefetchFunc }: TeamListProps) {

  const [deleteMultipleTeams] = useMutation(DELETE_MULTIPLE_TEAMS);
  // const [bulkTeams, setBulkTeams] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showBulkAction, setShowBulkAction] = useState<boolean>(false);
  const [checkedTeams, setCheckedTeams] = useState<Map<string, boolean>>(new Map());
  const [filteredGroupId, setFilteredGroupId] = useState<string | null>(null);

  const [sendCredentials, { data, error }] = useMutation(SEND_CREDENTIALS);

  // eslint-disable-next-line no-unused-vars
  const handleGroupFilter = (e: React.SyntheticEvent, groupId: string | null) => {
    e.preventDefault();
    setFilteredGroupId(groupId);
    setShowFilter(false);
  };

  // ===== Bulk Actions =====
  const handleCheckedTeam = (e: React.SyntheticEvent, teamId: string) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedItems: Map<string, boolean> = new Map(checkedTeams);
    if (inputEl.checked) {
      newCheckedItems.set(teamId, true);
    } else {
      newCheckedItems.set(teamId, false);
    }
    setCheckedTeams(newCheckedItems);
  }


  const handleCheckAllToggle = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedItems: Map<string, boolean> = new Map();
    if (inputEl.checked) {
      teamList.forEach((t) => {
        newCheckedItems.set(t._id, true);
      });
      setCheckedTeams(newCheckedItems);
    } else {
      setCheckedTeams(new Map());
    }
  }

  const handleShowBulk = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setShowBulkAction(!showBulkAction);
  }

  const handleBulkDelete = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (checkedTeams.size <= 0) return;
    try {
      setIsLoading(true);
      const checkedTeamIds = Array.from(checkedTeams)
        .filter(([_, isChecked]) => isChecked) // Filter for checked items
        .map(([teamId]) => teamId); // Map to just the team IDs
      const response = await deleteMultipleTeams({ variables: { teamIds: checkedTeamIds } });
      const success = await handleResponse({ response: response.data.deleteTeams, setActErr });
      if (success && fefetchFunc) await fefetchFunc();

    } catch (error: any) {
      handleError({ error, setActErr });
    } finally {
      setIsLoading(false);
    }

  }

  const handleBulkCredentials = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const checkedTeamIds = Array.from(checkedTeams)
      .filter(([_, isChecked]) => isChecked) // Filter for checked items
      .map(([teamId]) => teamId); // Map to just the team IDs

    // Send captain credentials to the captain and co captain credentials to co captain
    try {
      setIsLoading(true);
      await sendCredentials({ variables: { eventId, teamIds: [...checkedTeamIds] } });
      if (fefetchFunc) await fefetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendCredential = async (e: React.SyntheticEvent, teamId: string) => {
    try {
      setIsLoading(true);
      await sendCredentials({ variables: { eventId, teamIds: [teamId] } });
      if (fefetchFunc) await fefetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="team-list w-full">
      <div className="action-section flex justify-between mb-4">
        <div className="input-group flex items-center gap-2 justify-between">
          <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
          <label htmlFor="bulk-action">Bulk Action</label>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role='presentation' onClick={handleShowBulk} />
        </div>
        <div className="input-group flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
          <p>{filteredGroupId ? groupList.find((g) => g._id === filteredGroupId)?.name : "Group"}</p>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
        </div>

        {/* Filter Action Start  */}
        <ul className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
        <li key={"all"} role="presentation" className='capitalize' onClick={(e) => handleGroupFilter(e, null)}>All</li>
          {groupList.map((g, gI) => (<li key={gI} role="presentation" className='capitalize' onClick={(e) => handleGroupFilter(e, g._id)}>
            {g.name}
          </li>))}
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
        {teamList.map((team) => {
          if (!filteredGroupId || team.group?._id === filteredGroupId) {
            return (
              <TeamCard
                key={team._id}
                team={team}
                eventId={eventId}
                eventList={eventList || []}
                groupList={groupList}
                setIsLoading={setIsLoading}
                isChecked={checkedTeams.get(team._id) ?? false}
                fefetchFunc={fefetchFunc}
                handleSendCredential={handleSendCredential}
                handleCheckedTeam={handleCheckedTeam}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default TeamList;
