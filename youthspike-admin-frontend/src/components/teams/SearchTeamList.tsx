import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICheckedInput, IError, IEvent, IGroup, IOption, IResponse, ITeam } from '@/types';
import TeamCard from './TeamCard';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError } from '@/utils/handleError';
import { DELETE_MULTIPLE_TEAMS, UPDATE_TEAM } from '@/graphql/teams';
import { SEND_CREDENTIALS } from '@/graphql/event';
import SelectInput from '../elements/forms/SelectInput';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { useError } from '@/lib/ErrorProvider';
import { useMutation } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';
import { divisionsToOptionList, updateItemByIdMutable } from '@/utils/helper';
import Loader from '../elements/Loader';

interface IProps {
  event: IEvent | null;
  teamList: ITeam[];
  groupList: IGroup[];
  refetchFunc?: () => void;
}

interface ITeamUpdateResponse extends IResponse {
  data: ITeam;
}

// Sub-component: Bulk Action Menu
interface BulkActionMenuProps {
  isVisible: boolean;
  onBulkCredentials: (e: React.SyntheticEvent) => void;
  onShowChangeGroup: (e: React.SyntheticEvent) => void;
  onBulkMoveTeam: (e: React.SyntheticEvent) => void;
}

const BulkActionMenu: React.FC<BulkActionMenuProps> = ({
  isVisible,
  onBulkCredentials,
  onShowChangeGroup,
  onBulkMoveTeam,
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.ul
        className="absolute z-10 left-12 top-6 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <li
          role="presentation"
          className="capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
          onClick={onBulkCredentials}
        >
          <Image src="/icons/send-email.svg" alt="Send" width={16} height={16} />
          Send Credentials
        </li>
        <li
          role="presentation"
          className="capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
          onClick={onShowChangeGroup}
        >
          <Image src="/icons/share.svg" className="svg-white" alt="Send" width={16} height={16} />
          Change Group
        </li>
        <li
          role="presentation"
          className="capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
          onClick={onBulkMoveTeam}
        >
          <Image className="svg-white" src="/icons/move.svg" alt="Move" width={16} height={16} />
          Move team
        </li>
      </motion.ul>
    </AnimatePresence>
  );
};

// Sub-component: Group Filter Menu
interface GroupFilterMenuProps {
  isVisible: boolean;
  groupList: IGroup[];
  selectedGroupId: string | null;
  onGroupFilter: (e: React.SyntheticEvent, groupId: string | null) => void;
}

const GroupFilterMenu: React.FC<GroupFilterMenuProps> = ({
  isVisible,
  groupList,
  selectedGroupId,
  onGroupFilter,
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.ul
        className="absolute z-10 top-7 right-3 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <li
          key="all"
          role="presentation"
          className="capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          onClick={(e) => onGroupFilter(e, null)}
        >
          All
        </li>
        {groupList.map((group, index) => (
          <li
            key={index}
            role="presentation"
            className="capitalize px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            onClick={(e) => onGroupFilter(e, group._id)}
          >
            {group.name}
          </li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
};

// Sub-component: Move Team Dialog
interface IMoveTeamDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  selectedTeam: ITeam | null;
  divisionOptions: IOption[];
  groupOptions: IOption[];
  onTeamUpdateChange: (e: React.SyntheticEvent) => void;
  onMoveTeam: (e: React.SyntheticEvent) => void;
  onClose: () => void;
}

const MoveTeamDialog: React.FC<IMoveTeamDialogProps> = ({
  dialogRef,
  selectedTeam,
  divisionOptions,
  groupOptions,
  onTeamUpdateChange,
  onMoveTeam,
  onClose,
}) => {
  return (
    <dialog ref={dialogRef} className="modal-dialog">
      <div className="p-4">
        <button
          type="button"
          className="text-gray-400 hover:text-white transition-colors"
          onClick={onClose}
        >
          <Image width={20} height={20} src="/icons/close.svg" alt="close-button" className="svg-white" />
        </button>
        <h4 className="text-lg font-semibold text-white">Move Team - {selectedTeam?.name}</h4>
        <form className="flex flex-col gap-2" onSubmit={onMoveTeam}>
          <SelectInput
            handleSelect={onTeamUpdateChange}
            name="division"
            optionList={divisionOptions}
            defaultValue={selectedTeam?.division}
          />
          <SelectInput
            name="group"
            optionList={groupOptions}
            handleSelect={onTeamUpdateChange}
            defaultValue={typeof selectedTeam?.group === 'object' ? selectedTeam?.group._id : selectedTeam?.group}
          />
          <div className="actions flex gap-x-2 w-full justify-start items-center">
            <button className="btn-info" type="submit">
              Move Team
            </button>
            <button className="btn-danger" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

// Sub-component: Change Group Dialog
interface IChangeGroupDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  groupList: IGroup[];
  onBulkChangeGroup: (e: React.SyntheticEvent) => void;
}

const ChangeGroupDialog: React.FC<IChangeGroupDialogProps> = ({
  dialogRef,
  groupList,
  onBulkChangeGroup,
}) => {
  const groupOptions = useMemo(
    () =>
      groupList.map((group, index) => ({
        id: index + 1,
        value: group._id,
        text: group.name,
      })),
    [groupList]
  );

  return (
    <dialog ref={dialogRef} className="modal-dialog">
      <h3>Change Group</h3>
      <SelectInput name="group" optionList={groupOptions} handleSelect={onBulkChangeGroup} />
    </dialog>
  );
};

// Main Component
function SearchTeamList({ teamList, groupList, event, refetchFunc }: IProps) {
  if (!event) {
    throw new Error('Event not found!');
  }

  // Hooks
  const { setActErr } = useError();

  // References
  const changeGroupDialogRef = useRef<HTMLDialogElement | null>(null);
  const moveTeamDialogRef = useRef<HTMLDialogElement | null>(null);

  // Local State
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState<boolean>(false);
  const [isBulkActionMenuVisible, setIsBulkActionMenuVisible] = useState<boolean>(false);
  const [checkedTeamsMap, setCheckedTeamsMap] = useState<Map<string, boolean>>(new Map());
  const [selectedGroupIdFilter, setSelectedGroupIdFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTeamForMove, setSelectedTeamForMove] = useState<ITeam | null>(null);
  const [teamUpdateInput, setTeamUpdateInput] = useState<Partial<Pick<ITeam, 'division' | 'group'>>>({});
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>(teamList);

  // Mutations
  const [sendCredentialsMutation, { data, error }] = useMutation(SEND_CREDENTIALS);
  const [deleteMultipleTeamsMutation] = useMutation<{ deleteTeams: IResponse }>(DELETE_MULTIPLE_TEAMS);
  const [updateGroupMutation] = useMutation(UPDATE_GROUP);
  const [moveTeamMutation] = useMutation<{ updateTeam: ITeamUpdateResponse }>(UPDATE_TEAM);

  // Utility: Extract checked team IDs
  const getCheckedTeamIds = (): string[] => {
    return Array.from(checkedTeamsMap)
      .filter(([_, isChecked]) => isChecked)
      .map(([teamId]) => teamId);
  };

  // Handlers: Filter
  const handleGroupFilterSelection = (e: React.SyntheticEvent, groupId: string | null): void => {
    e.preventDefault();
    setSelectedGroupIdFilter(groupId);
    setIsFilterMenuVisible(false);
    setIsBulkActionMenuVisible(false);
  };

  // Handlers: Checkbox
  const handleTeamCheckboxToggle = (e: React.SyntheticEvent, teamId: string): void => {
    const inputElement = e.target as HTMLInputElement;
    const updatedCheckedTeams = new Map(checkedTeamsMap);
    updatedCheckedTeams.set(teamId, inputElement.checked);
    setCheckedTeamsMap(updatedCheckedTeams);
  };

  const handleSelectAllCheckboxToggle = (e: React.SyntheticEvent): void => {
    const inputElement = e.target as HTMLInputElement;
    const updatedCheckedTeams = new Map<string, boolean>();

    if (inputElement.checked) {
      teamList.forEach((team) => {
        updatedCheckedTeams.set(team._id, true);
      });
    }

    setCheckedTeamsMap(updatedCheckedTeams);
  };

  // Handlers: Bulk Action Menu
  const handleBulkActionMenuToggle = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    setIsBulkActionMenuVisible(!isBulkActionMenuVisible);
  };

  const handleBulkDeleteTeams = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();

    const checkedTeamIds = getCheckedTeamIds();
    if (checkedTeamIds.length === 0) return;

    try {
      setIsLoading(true);
      const response = await deleteMultipleTeamsMutation({ variables: { teamIds: checkedTeamIds } });
      const isSuccessful = await handleResponseCheck(response.data?.deleteTeams, setActErr);
      if (isSuccessful && refetchFunc) await refetchFunc();
    } catch (error: any) {
      handleError({ error, setActErr });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSendCredentials = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    const checkedTeamIds = getCheckedTeamIds();

    try {
      setIsLoading(true);
      await sendCredentialsMutation({ variables: { eventId: event._id, teamIds: checkedTeamIds } });
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowChangeGroupDialog = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const checkedTeamIds = getCheckedTeamIds();

    if (checkedTeamIds.length === 0) {
      return setActErr({ message: 'You must select a few teams and do this action', success: false });
    }

    setIsBulkActionMenuVisible(false);
    setIsFilterMenuVisible(false);
    changeGroupDialogRef.current?.showModal();
  };

  const handleBulkChangeGroup = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    changeGroupDialogRef.current?.close();

    const inputElement = e.target as HTMLInputElement;
    const checkedTeamIds = getCheckedTeamIds();

    try {
      setIsLoading(true);
      await updateGroupMutation({
        variables: { updateInput: { _id: inputElement.value, teams: checkedTeamIds } },
      });
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMoveTeams = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    const checkedTeamIds = getCheckedTeamIds();

    try {
      setIsLoading(true);
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers: Individual Team Actions
  const handleSendSingleTeamCredential = async (e: React.SyntheticEvent, teamId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await sendCredentialsMutation({ variables: { eventId: event._id, teamIds: [teamId] } });
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMoveTeamDialog = (e: React.SyntheticEvent, team: ITeam): void => {
    e.preventDefault();
    setSelectedTeamForMove(team);
    moveTeamDialogRef.current?.showModal();
  };

  const handleTeamUpdateInputChange = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const inputElement = e.target as HTMLInputElement;
    setTeamUpdateInput((previousInput) => ({ ...previousInput, [inputElement.name]: inputElement.value }));
  };



  const handleMoveTeamSubmit = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();

    try {
      setIsLoading(true);
      moveTeamDialogRef.current?.close();
      const response = await moveTeamMutation({
        variables: { input: { ...teamUpdateInput }, teamId: selectedTeamForMove?._id, eventId: event._id },
      });
      const isSuccessful = await handleResponseCheck(response.data?.updateTeam, setActErr);
      if (isSuccessful && refetchFunc) {
        await refetchFunc();

        if (response.data?.updateTeam.data) {
          const updatedList = updateItemByIdMutable(filteredTeamList, response.data?.updateTeam.data);
          setFilteredTeamList(updatedList)
        }

      }
    } catch (error) {
      console.error(error);
      handleError({ error, setActErr });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (e: React.SyntheticEvent): Promise<void> => {
    // Implementation pending
  };

  // Memoized Values
  const divisionOptionsList = useMemo(() => {
    return divisionsToOptionList(event?.divisions || '');
  }, [event]);

  const groupOptionsList = useMemo(() => {
    const options: IOption[] = [];

    for (let i = 0; i < groupList.length; i += 1) {
      const group = groupList[i];

      if (!teamUpdateInput?.division) {
        options.push({ id: i + 1, value: group._id, text: group.name });
        continue;
      }

      if (group.division.toLowerCase() === teamUpdateInput.division.toLowerCase()) {
        options.push({ id: i + 1, value: group._id, text: group.name });
      }
    }

    return options;
  }, [groupList, teamUpdateInput]);

  // const filteredTeamList = useMemo(() => {
  //   return teamList.filter((team) => {
  //     if (!selectedGroupIdFilter) return true;
  //     return team.group?._id === selectedGroupIdFilter || String(team.group) === selectedGroupIdFilter;
  //   });
  // }, [teamList, selectedGroupIdFilter]);

  const selectedGroupName = useMemo(() => {
    return selectedGroupIdFilter ? groupList.find((group) => group._id === selectedGroupIdFilter)?.name : 'Group';
  }, [selectedGroupIdFilter, groupList]);


  useEffect(() => {
    const filteredTeams = teamList.filter((team) => {
      if (!selectedGroupIdFilter) return true;

      return (
        team.group?._id === selectedGroupIdFilter ||
        String(team.group) === selectedGroupIdFilter
      );
    });

    setFilteredTeamList(filteredTeams);
  }, [teamList, selectedGroupIdFilter]);

  return (
    <div className="team-list w-full">
      {isLoading && <Loader />}

      {/* Action Section */}
      <div className="action-section flex justify-between mb-4">
        {/* Bulk Action Control */}
        <div className="input-group relative flex items-center gap-2 justify-between">
          <input onClick={handleSelectAllCheckboxToggle} type="checkbox" name="bulkaction" id="bulk-action" />
          <label htmlFor="bulk-action">Bulk Action</label>
          <Image
            width={imgSize.logo}
            height={imgSize.logo}
            src="/icons/dropdown.svg"
            alt="dropdown"
            className="w-6 svg-white"
            role="presentation"
            onClick={handleBulkActionMenuToggle}
          />
          <BulkActionMenu
            isVisible={isBulkActionMenuVisible}
            onBulkCredentials={handleBulkSendCredentials}
            onShowChangeGroup={handleShowChangeGroupDialog}
            onBulkMoveTeam={handleBulkMoveTeams}
          />
        </div>

        {/* Group Filter Control */}
        <div className="input-group relative">
          <div
            className="button flex items-center gap-2 justify-between"
            role="presentation"
            onClick={() => setIsFilterMenuVisible((previous) => !previous)}
          >
            <p>{selectedGroupName}</p>
            <Image
              width={imgSize.logo}
              height={imgSize.logo}
              src="/icons/dropdown.svg"
              alt="dropdown"
              className="w-6 svg-white"
            />
          </div>
          <GroupFilterMenu
            isVisible={isFilterMenuVisible}
            groupList={groupList}
            selectedGroupId={selectedGroupIdFilter}
            onGroupFilter={handleGroupFilterSelection}
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="team-list-card grid grid-cols-1 lg:grid-cols-2 gap-2">
        {filteredTeamList.map((team) => (
          <TeamCard
            key={team._id}
            team={team}
            eventId={event._id}
            groupList={groupList}
            isChecked={checkedTeamsMap.get(team._id) ?? false}
            refetchFunc={refetchFunc}
            handleSendCredential={handleSendSingleTeamCredential}
            handleMoveTeamOpen={handleOpenMoveTeamDialog}
            handleCheckedTeam={handleTeamCheckboxToggle}
          />
        ))}
      </div>

      {/* Move Team Dialog */}
      <MoveTeamDialog
        dialogRef={moveTeamDialogRef}
        selectedTeam={selectedTeamForMove}
        divisionOptions={divisionOptionsList}
        groupOptions={groupOptionsList}
        onTeamUpdateChange={handleTeamUpdateInputChange}
        onMoveTeam={handleMoveTeamSubmit}
        onClose={() => moveTeamDialogRef.current?.close()}
      />

      {/* Change Group Dialog */}
      <ChangeGroupDialog
        dialogRef={changeGroupDialogRef}
        groupList={groupList}
        onBulkChangeGroup={handleBulkChangeGroup}
      />
    </div>
  );
}

export default SearchTeamList;