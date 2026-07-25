import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IBadge, IEmailcontent, IEvent, IGetTeamResponse, IGroup, IGroupRelatives, IOption, IPlayer, IPlayerExpRel, IResponse, ITeam, TUpdateTeam } from '@/types';
import TeamCard from './TeamCard';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import { handleError } from '@/utils/handleError';
import { DELETE_MULTIPLE_TEAMS, DELETE_TEAM, TEAM_BADGE_FRAGMENT, UPDATE_TEAM, UPDATE_TEAMS } from '@/graphql/teams';
import { SEND_CREDENTIALS } from '@/graphql/event';
import SelectInput from '../elements/forms/SelectInput';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import { useMessage } from '@/lib/MessageProvider';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/request-handlers/playerHelpers';
import { divisionsToOptionList } from '@/utils/helper';
import Loader from '../elements/Loader';
import { createBadgeMap } from '@/utils/badge/badge-helpers';
import BulkActionMenu from './BulkActionMenu';
import GroupFilterMenu from './GroupFilterMenu';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import MoveTeamDialog from './MoveTeamDialog';
import ChangeGroupDialog from './ChangeGroupDialog';
import updateTeam from '@/utils/request-handlers/updateTeam';

interface ISearchTeamListProps {
  event: IEvent | null;
  teamList: ITeam[];
  groupList: IGroup[];
  captainMap: Map<string, IPlayer>;
  emailcontents: IEmailcontent[];
  badges: IBadge[];
  refetchFunc?: () => void;
}

interface ITeamUpdateResponse extends IResponse {
  data: ITeam;
}
interface ITeamsUpdateResponse extends IResponse {
  data: ITeam[];
}



type TUpdateTeams = Partial<Pick<ITeam, 'division' | 'groups'> & {
  teamIds: string[];
}>;


// Main Component
function SearchTeamList({ teamList, groupList, event, captainMap, emailcontents, badges, refetchFunc }: ISearchTeamListProps) {
  if (!event) {
    throw new Error('Event not found!');
  }

  // Hooks
  const { setMessage } = useMessage();
  const apolloClient = useApolloClient();

  // References
  const changeGroupDialogRef = useRef<HTMLDialogElement | null>(null);
  const moveTeamDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);

  // Local State
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState<boolean>(false);
  const [isBulkActionMenuVisible, setIsBulkActionMenuVisible] = useState<boolean>(false);
  const [checkedTeamsMap, setCheckedTeamsMap] = useState<Map<string, boolean>>(new Map());
  const [selectedGroupIdFilter, setSelectedGroupIdFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);
  const [selectedTeamForDelete, setSelectedTeamForDelete] = useState<ITeam | null>(null);
  const [teamUpdateInput, setTeamUpdateInput] = useState<TUpdateTeams>({});
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>(teamList);

  // Mutations
  const [sendCredentialsMutation, { data, error }] = useMutation(SEND_CREDENTIALS);
  const [deleteMultipleTeamsMutation] = useMutation<{ deleteTeams: IResponse }>(DELETE_MULTIPLE_TEAMS);
  const [updateGroupMutation] = useMutation<{ updateGroup: IResponse }>(UPDATE_GROUP);
  const [mutateTeam] = useMutation<{ updateTeam: IGetTeamResponse }>(UPDATE_TEAM);
  const [moveTeamsMutation] = useMutation<{ updateTeams: ITeamsUpdateResponse }>(UPDATE_TEAMS);
  const [deleteTeam] = useMutation<{ deleteTeam: ITeamUpdateResponse }>(DELETE_TEAM);


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
      const isSuccessful = await handleResponseCheck(response.data?.deleteTeams, setMessage);
      if (isSuccessful && refetchFunc) await refetchFunc();
    } catch (error: any) {
      handleError({ error, setMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSendCredentials = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    const checkedTeamIds = getCheckedTeamIds();

    try {
      setIsLoading(true);
      const response = await sendCredentialsMutation({ variables: { eventId: event._id, teamIds: checkedTeamIds } });
      // @ts-ignore
      const isSuccessful = await handleResponseCheck(response?.data?.sendCredentials, setMessage);
      if (isSuccessful && refetchFunc) await refetchFunc();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowChangeGroupDialog = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const checkedTeamIds = getCheckedTeamIds();

    if (checkedTeamIds.length === 0) {
      return setMessage({ type: 'error', message: 'You must select a few teams and do this action' });
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
      const res = await updateGroupMutation({
        variables: { updateInput: { _id: inputElement.value, teams: checkedTeamIds } },
      });
      // Update cache
      if (res.data && res.data.updateGroup.code === 202) {
        setFilteredTeamList((prev) => {
          // Set group Id to specific team
          const updatedTeams: ITeam[] = [];
          for (const t of prev) {
            if (checkedTeamIds.includes(t._id)) {
              // @ts-ignore
              updatedTeams.push({ ...t, group: inputElement.value });
            } else {
              updatedTeams.push(t);
            }
          }
          return updatedTeams;
        });
      }


    } catch (error) {
      console.error(error);
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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleonBulkTeamOpen = (e: React.SyntheticEvent) => {
    e.preventDefault();
    moveTeamDialogRef.current?.showModal();
    setIsBulkActionMenuVisible(false);
  }

  // Handlers: Individual Team Actions
  const handleSendSingleTeamCredential = async (e: React.SyntheticEvent, teamId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await sendCredentialsMutation({ variables: { eventId: event._id, teamIds: [teamId] } });
      // @ts-ignore
      const isSuccessful = await handleResponseCheck(response?.data?.sendCredentials, setMessage);
      if (isSuccessful && refetchFunc) await refetchFunc();
    } catch (error) {
      console.error(error);
      handleError({ error, setMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMoveTeamDialog = (e: React.SyntheticEvent, team: ITeam): void => {
    e.preventDefault();
    setSelectedTeam(team);
    moveTeamDialogRef.current?.showModal();
  };

  const handleDeleteTeamOpen = (e: React.SyntheticEvent, team: ITeam): void => {
    e.preventDefault();
    setSelectedTeam(team);
    deleteDialogRef.current?.showModal();
  };

  const handleTeamUpdateInputChange = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const inputElement = e.target as HTMLInputElement;
    let val = null;
    if (inputElement.name === 'groups') {
      val = [inputElement.value];
    } else {
      val = inputElement.value;
    }
    if (selectedTeam) {
      const updatedCheckedTeams = new Map(checkedTeamsMap);
      updatedCheckedTeams.set(selectedTeam._id, true);
      setCheckedTeamsMap(updatedCheckedTeams);
    }
    setTeamUpdateInput((prevInput) => ({ ...prevInput, [inputElement.name]: val, }));

  };



  const handleMoveTeamSubmit = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();

    try {
      setIsLoading(true);
      moveTeamDialogRef.current?.close();
      // Change division and group
      const checkedTeamIds = getCheckedTeamIds();


      const variables = { input: { ...teamUpdateInput, teamIds: checkedTeamIds }, eventId: event._id };

      const response = await moveTeamsMutation({
        variables,
      });
      const isSuccessful = await handleResponseCheck(response.data?.updateTeams, setMessage);
      if (isSuccessful) {
        if (response.data?.updateTeams.data) {
          // const updatedList = updateItemByIdMutable(filteredTeamList, response.data?.updateTeams.data);
          // setFilteredTeamList(updatedList)
        }

        setSelectedTeam(null);

        window.location.reload();

      }
    } catch (error) {
      console.error(error);
      handleError({ error, setMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (e: React.SyntheticEvent, teamId: string) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      deleteDialogRef.current?.close();
      const response = await deleteTeam({ variables: { teamId } });
      const isSuccessful = await handleResponseCheck(response.data?.deleteTeam, setMessage);
      if (isSuccessful) {
        if (response.data?.deleteTeam) {
          const updatedList = filteredTeamList.filter(t => t._id !== selectedTeamForDelete?._id)
          setFilteredTeamList(updatedList)
        }
        setSelectedTeamForDelete(null);

      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (e: React.SyntheticEvent): Promise<void> => {
    // Implementation pending
  };

  const handleUpdateTeam = async (e: React.SyntheticEvent, update: Partial<TUpdateTeam>, teamId: string) => {
    const prevTeam = teamList.find((team) => team._id === teamId);
    if (!prevTeam) {
      setMessage({ type: 'error', message: "There are not previous team found!" })
      return;
    }
    await updateTeam({
      prevTeam,
      updateTeamState: update,
      setMessage,
      setIsLoading,
      apolloClient,
      mutateTeam,
      events: prevTeam ? (prevTeam?.events.map((e: string | IEvent) => typeof e === "object" ? e._id : e) ?? []) : [],
    });
    // Update cache here, set team.badge to update.badge if update.badge exist
    if (update.badge) {
      apolloClient.writeFragment({
        id: apolloClient.cache.identify({
          __typename: "Team",
          _id: teamId,
        }),
        fragment: TEAM_BADGE_FRAGMENT,
        data: {
          __typename: "Team",
          badge: update.badge,
        },
      });
      // Update React state
      setFilteredTeamList((prev) => {
        const index = prev.findIndex((team) => team._id === teamId);

        if (index === -1) return prev;

        const next = [...prev];
        next[index] = {
          ...next[index],
          // @ts-ignore
          badge: update.badge,
        };

        return next;
      });
    }
  }

  // Memoized Values
  const divisionOptionsList = useMemo(() => {
    // selectedTeam
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

      if (group?.division?.toLowerCase() === teamUpdateInput?.division?.toLowerCase()) {
        options.push({ id: i + 1, value: group._id, text: group.name });
      }
    }

    return options;
  }, [groupList, teamUpdateInput]);


  const selectedGroupName = useMemo(() => {
    return selectedGroupIdFilter ? groupList.find((group) => group._id === selectedGroupIdFilter)?.name : 'Group';
  }, [selectedGroupIdFilter, groupList]);

  const badgeMap = useMemo(() => createBadgeMap(badges), [badges]);

  const emailcontentsMapByTeam = useMemo(() => {
    const map = new Map<string, IEmailcontent[]>();
    for (const emailcontent of emailcontents) {
      if (map.has(emailcontent.team)) {
        map.get(emailcontent.team)?.push(emailcontent);
      } else {
        map.set(emailcontent.team, [emailcontent]);
      }
    }
    return map;
  }, [emailcontents]);


  useEffect(() => {
    if (!selectedGroupIdFilter) {
      setFilteredTeamList(teamList);
      return;
    }

    const filterId = selectedGroupIdFilter;

    const filteredTeams = teamList.filter((team) =>
      team.groups?.some((g) => String(g) == filterId) // loose equality avoids String()
    );

    setFilteredTeamList(filteredTeams);
  }, [teamList, selectedGroupIdFilter]);




  if (isLoading) return <Loader />;

  return (
    <div className="team-list w-full">
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
            onBulkTeamOpen={handleonBulkTeamOpen}
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
            onGroupFilter={handleGroupFilterSelection}
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="team-list-card grid grid-cols-1 lg:grid-cols-2 gap-2">
        {filteredTeamList.map((team) => (
          <TeamCard
            key={team._id}
            team={({ ...team, captain: team.captain ? (captainMap.get(String(team.captain)) as unknown as IPlayerExpRel || null) : null })}
            eventId={event._id}
            groupList={groupList}
            isChecked={checkedTeamsMap.get(team._id) ?? false}
            emailcontents={emailcontentsMapByTeam.get(team._id)}
            badge={team.badge ? badgeMap.get(String(team.badge)) : null}
            badges={badges}
            onSendCredential={handleSendSingleTeamCredential}
            onUpdateTeam={handleUpdateTeam}
            onMoveTeamOpen={handleOpenMoveTeamDialog}
            onCheckedTeam={handleTeamCheckboxToggle}
            onDeleteTeamOpen={handleDeleteTeamOpen}
          />
        ))}
      </div>

      <DeleteConfirmDialog deleteDialogRef={deleteDialogRef} handleDeleteTeam={handleDeleteTeam} selectedTeam={selectedTeamForDelete} />

      {/* Move Team Dialog */}
      <MoveTeamDialog
        dialogRef={moveTeamDialogRef}
        selectedTeam={selectedTeam}
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
        onBulkGroupChange={handleBulkChangeGroup}
      />
    </div>
  );
}

export default SearchTeamList;