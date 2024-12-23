import React, { useRef, useState } from 'react';
import { ICheckedInput, IError, IEvent, IGroup, ITeam } from '@/types';
import TeamCard from './TeamCard';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError, handleResponse } from '@/utils/handleError';
import { useMutation } from '@apollo/client';
import { DELETE_MULTIPLE_TEAMS } from '@/graphql/teams';
import { SEND_CREDENTIALS } from '@/graphql/event';
import SelectInput from '../elements/forms/SelectInput';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'framer-motion';
import { menuVariants } from '@/utils/animation';

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
  const [updateGroup] = useMutation(UPDATE_GROUP);

  const cngGroupEl = useRef<HTMLDialogElement | null>(null);

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
    setShowBulkAction(false);
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

  const handleShowChangeGroup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const checkedTeamIds = Array.from(checkedTeams)
      .filter(([_, isChecked]) => isChecked) // Filter for checked items
      .map(([teamId]) => teamId); // Map to just the team IDs
    if (checkedTeamIds.length === 0) {
      return setActErr({ message: "You must select a few teams and do this action", success: false });
    }

    setShowBulkAction(false);
    setShowFilter(false);
    if (cngGroupEl.current) {
      cngGroupEl.current.showModal();
    }
  }


  const handleBulkChangeGroup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (cngGroupEl.current) {
      cngGroupEl.current.close();
    }
    const inputEl = e.target as HTMLInputElement;

    const checkedTeamIds = Array.from(checkedTeams)
      .filter(([_, isChecked]) => isChecked) // Filter for checked items
      .map(([teamId]) => teamId); // Map to just the team IDs


    // console.log({ groupId: inputEl.value, checkedTeamIds });

    // Send captain credentials to the captain and co captain credentials to co captain
    try {
      setIsLoading(true);
      await updateGroup({ variables: { updateInput: { _id: inputEl.value, teams: checkedTeamIds } } })
      if (fefetchFunc) await fefetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleBulkMoveTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const checkedTeamIds = Array.from(checkedTeams)
      .filter(([_, isChecked]) => isChecked) // Filter for checked items
      .map(([teamId]) => teamId); // Map to just the team IDs


    // Send captain credentials to the captain and co captain credentials to co captain
    try {
      setIsLoading(true);
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
        <div className="input-group relative flex items-center gap-2 justify-between">
          <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
          <label htmlFor="bulk-action">Bulk Action</label>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role='presentation' onClick={handleShowBulk} />
          {/* Bulk Action start  */}
          <AnimatePresence>
            {showBulkAction && (
              <motion.ul
                className="absolute z-10 left-12 top-6 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <li role="presentation" className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center' onClick={handleBulkDelete}>
                  <Image className="svg-white" src="/icons/delete.svg" alt="Delete" width={16} height={16} />
                  delete
                </li>
                <li role="presentation" className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center' onClick={handleBulkCredentials}>
                  <Image src="/icons/send-email.svg" alt="Send" width={16} height={16} />
                  Send Credentials
                </li>
                <li role="presentation" className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center' onClick={handleShowChangeGroup}>
                  <Image src="/icons/share.svg" className="svg-white" alt="Send" width={16} height={16} />
                  Change Group
                </li>

                <li role="presentation" className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center' onClick={handleBulkMoveTeam}>
                  <Image className="svg-white" src="/icons/move.svg" alt="Move" width={16} height={16} />
                  Move team
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
          {/* Bulk Action end  */}
        </div>
        <div className="input-group relative ">
          <div className="button flex items-center gap-2 justify-between" role="presentation" onClick={() => setShowFilter((prevState) => !prevState)}>
            <p>{filteredGroupId ? groupList.find((g) => g._id === filteredGroupId)?.name : "Group"}</p>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" />
          </div>

          {/* Filter Action Start  */}
          <AnimatePresence>
            {showFilter && (
              <motion.ul
                className="absolute z-10 top-7 right-3 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <li key={"all"} role="presentation" className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
                  onClick={(e) => handleGroupFilter(e, null)}>All</li>
                {groupList.map((g, gI) => (<li key={gI} role="presentation"
                  className='capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' onClick={(e) => handleGroupFilter(e, g._id)}>
                  {g.name}
                </li>))}

              </motion.ul>
            )}
          </AnimatePresence>
          {/* Filter Action End  */}
        </div>




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

      <dialog ref={cngGroupEl} className='w-4/6 md:w-3/6 py-4'>
        <h3>Change Group</h3>
        {/* .filter((g) => g.division.trim().toUpperCase() === team.division.trim().toUpperCase()) */}
        <SelectInput
          name="group"
          optionList={groupList.map((g) => ({
            value: g._id,
            text: g.name,
          }))}
          handleSelect={handleBulkChangeGroup}
          vertical
        />
      </dialog>
    </div>
  );
}

export default TeamList;
