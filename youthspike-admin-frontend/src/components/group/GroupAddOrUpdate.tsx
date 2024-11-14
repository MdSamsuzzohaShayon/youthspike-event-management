import { IError, IGroupAdd, ITeam } from '@/types';
import React, { useEffect, useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import SelectInput from '../elements/forms/SelectInput';
import { divisionsToOptionList } from '@/utils/helper';
import TeamSelectInput from '../elements/forms/TeamSelectInput';
import { useMutation } from '@apollo/client';
import { ADD_GROUP } from '@/graphql/group';
import { handleError, handleResponse } from '@/utils/handleError';

interface IGroupAddOrUpdateProps {
  divisions: string;
  teamList: ITeam[];
  update: boolean;
  eventId: string;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function GroupAddOrUpdate({ eventId, divisions, teamList, update, setActErr, setIsLoading }: IGroupAddOrUpdateProps) {

  const [eventAdd] = useMutation(ADD_GROUP);

  const [groupState, setGroupState] = useState<IGroupAdd>({
    active: true,
    division: '',
    name: '',
    event: eventId,
    teams: [],
  });

  const [updateGroup, setUpdateGroup] = useState<Partial<IGroupAdd>>({});
  const [filteredTeams, setFilteredTeams] = useState<ITeam[]>([]);

  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (!update) {
      setGroupState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setUpdateGroup((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleDivisionInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setGroupState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    const nTList = teamList.filter((t) => t.division.toString().toUpperCase() === inputEl.value.toString().toUpperCase());
    setFilteredTeams(nTList);
  };


  const handleCheckboxChange = (teamId: string, isChecked: boolean) => {
    if (isChecked) {
      setGroupState((prevState) => ({...prevState, teams: [...new Set([...prevState.teams, teamId])]}));
    } else {
      setGroupState((prevState) => ({...prevState, teams: prevState.teams.filter((p) => p !== teamId)}));
    }
  }

  const handleGroupAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if(groupState.name === ''){
      setActErr({message: "Must set a name for the group", success: false});
      return;
    }

    if(groupState.division === ''){
      setActErr({message: "Must a division for the group", success: false});
      return;
    }

    try {
      const groupResponse = await eventAdd({variables: {input: groupState}});

      const success = await handleResponse({response: groupResponse.data, setActErr});
      console.log({groupResponse, success});
      
      
    } catch (error: any) {
      handleError({error, setActErr})
      
    }
  }


  useEffect(() => {
    if (teamList) {
      setFilteredTeams(teamList);
    }
  }, [teamList]);


  return (
    <form onSubmit={handleGroupAdd} className="flex flex-col gap-2">
      <TextInput key="ti-eau-1" required={!update} defaultValue={groupState.name}
        handleInputChange={handleInputChange} lblTxt="Name" name="name" lw="w-2/6" rw="w-4/6" />
      <SelectInput name='division' handleSelect={handleDivisionInputChange} optionList={divisionsToOptionList(divisions)} lblTxt="Division" lw="w-2/6" rw="w-4/6" />

      <TeamSelectInput name='teams' teamList={filteredTeams} eventId={eventId} handleCheckboxChange={handleCheckboxChange} />

      {/* {!update ? (
          <TextInput key="ti-eau-2" required={!update} defaultValue={groupState.divisions} handleInputChange={handleDivisionInputChange} readOnly={update} lblTxt="DIVISIONS" name="divisions" lw="w-2/6" rw="w-4/6" />
        ) : (
          <h4>Divisions</h4>
        )} */}

      <button className="btn-info" type="submit">
        {update ? 'Update' : 'Submit'}
      </button>
    </form>
  )
}

export default GroupAddOrUpdate;