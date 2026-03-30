'use client';

import { IGroupAdd, ITeam } from '@/types';
import React, { useEffect, useState } from 'react';
import TeamSelectInput from '../elements/forms/TeamSelectInput';
import { ADD_GROUP } from '@/graphql/group';
import { handleError } from '@/utils/handleError';
import { useRouter } from 'next/navigation';
import { EGroupRule, ICreateGroup } from '@/types/group';
import { useMessage } from '@/lib/MessageProvider';
import InputField from '../elements/forms/InputField';
import { useMutation } from '@apollo/client/react';
import { handleResponseCheck } from '@/utils/requestHandlers/playerHelpers';
import { useLdoId } from '@/lib/LdoProvider';

interface IGroupAddOrUpdateProps {
  eventId: string;
  teamList: ITeam[];
  update: boolean;
  prevGroup?: IGroupAdd | null;
  division?: string;
}

function GroupAddOrUpdate({ eventId, teamList, update, prevGroup, division }: IGroupAddOrUpdateProps) {
  // Hooks
  const [eventAdd] = useMutation<{ createGroup: ICreateGroup }>(ADD_GROUP);
  const router = useRouter();
  const { showMessage } = useMessage();
  const { ldoIdUrl } = useLdoId();

  // Local State
  const [groupState, setGroupState] = useState<IGroupAdd>({
    active: true,
    division: '',
    name: '',
    rule: EGroupRule.CAN_PLAY_EACH_OTHER,
    event: eventId,
    teams: [],
    matches: [],
  });

  const [updateGroup, setUpdateGroup] = useState<Partial<IGroupAdd>>({});
  const [filteredTeams, setFilteredTeams] = useState<ITeam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (!update) {
      setGroupState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setGroupState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
      setUpdateGroup((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleDivisionInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setGroupState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    let nTList = teamList.filter((t) => t.division && inputEl.value && t.division.toString().toUpperCase() === inputEl.value.toString().toUpperCase());
    // If A team already has a group he should not be shown
    nTList = nTList.filter((t) => !t.group || !t.group?._id);
    setFilteredTeams(nTList);
  };

  const handleCheckboxChange = (teamId: string, isChecked: boolean) => {
    if (isChecked) {
      setGroupState((prevState) => ({ ...prevState, teams: [...new Set([...prevState.teams, teamId])] }));
    } else {
      setGroupState((prevState) => ({ ...prevState, teams: prevState.teams.filter((p) => p !== teamId) }));
    }
  };

  const handleGroupAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!division || division === '') {
      showMessage({ message: 'Must a division for the group', type:"error" });
      return;
    }

    try {
      setIsLoading(true);
      const groupResponse = await eventAdd({ variables: { input: { ...groupState, division } } });

      const success = await handleResponseCheck(groupResponse.data?.createGroup, showMessage);
      if (success) {
        router.push(`/${eventId}/groups/${ldoIdUrl}`);
        router.refresh();
      }
    } catch (error: any) {
      handleError({ error, showMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (teamList) {
      setFilteredTeams(teamList.filter((t) => !t.group || !t.group?._id));
    }
  }, [teamList]);

  useEffect(() => {
    if (prevGroup) {
      setGroupState((prevState) => ({
        ...prevState,
        ...prevGroup,
      }));
    }
  }, [prevGroup]);

  return (
    <form onSubmit={handleGroupAdd} className="flex flex-col gap-2">
      <InputField type="text" key="ti-eau-1" required={!update} defaultValue={groupState.name} handleInputChange={handleInputChange} label="Name" name="name" />

      <div className="mt-4">
        <TeamSelectInput name="teams" teamList={filteredTeams} eventId={eventId} handleCheckboxChange={handleCheckboxChange} />
      </div>

      <button className="btn-info mt-4" type="submit">
        {update ? 'Update' : 'Submit'}
      </button>
    </form>
  );
}

export default GroupAddOrUpdate;
