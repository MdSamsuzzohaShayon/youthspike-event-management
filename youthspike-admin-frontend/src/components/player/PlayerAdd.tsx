import React, { useRef, useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import { IPlayer, IPlayerAdd } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption, ITeam } from '@/types';
import { gql, useMutation } from '@apollo/client';
import { CREATE_PLAYER, GET_PLAYERS, CREATE_PLAYER_RAW, UPDATE_PLAYER_RAW, UPDATE_PLAYER, GET_EVENT_WITH_PLAYERS } from '@/graphql/players';
import EmailInput from '../elements/forms/EmailInput';
import Link from 'next/link';
import FileInput from '../elements/forms/FileInput';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { useRouter } from 'next/navigation';

interface IPlayerAddProps {
  eventId: string,
  update: boolean;
  prevPlayer?: IPlayer | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList: IOption[];
  teamList: ITeam[]
}

const initialPlayerAdd = {
  firstName: '',
  lastName: '',
  email: '',
  event: '',
  // team: '',
  rank: "0"
};

function PlayerAdd({ eventId, setIsLoading, update, prevPlayer, setAddPlayer, divisionList, teamList }: IPlayerAddProps) {

  const router = useRouter();

  const [actErr, setActErr] = useState<IError | null>(null);
  const [playerAdd, setPlayerAdd] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer, { data, client }] = useMutation(CREATE_PLAYER);
  const [updatePlayer, { data: puData, client: mutateClient }] = useMutation(UPDATE_PLAYER);
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);

  const uploadedProfile = useRef<File | null>(null);

  /**
   * Input Change
   */
  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (update) {
      setPlayerUpdate(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setPlayerAdd(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  }

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      uploadedProfile.current = inputEl.files[0];
    }
  }

  const handleSelect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (update) {
      setPlayerUpdate(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setPlayerAdd(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    const dl: IOption[] = [];
    for (let i = 0; i < teamList.length; i += 1) {
      if (teamList[i].division.trim().toLowerCase() === inputEl.value.trim().toLowerCase()) {
        dl.push({ text: teamList[i].name, value: teamList[i]._id });
      }
    }
    setTeamOptions(dl);
  }

  /**
   * Create or update player
   */
  const handleAddPlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const playerAddObj = structuredClone(playerAdd);
      // @ts-ignore
      if (playerAddObj.rank) playerAddObj.rank = parseInt(playerAddObj.rank, 10);
      playerAddObj.event = eventId;

      let playerRes = null;
      if (uploadedProfile && uploadedProfile.current) {
        const formData = new FormData();
        const mutationVariables = {
          input: update ? { ...playerUpdate } : playerAddObj,
          profile: null
        };
        // @ts-ignore
        if (update) mutationVariables.playerId = prevPlayer?._id;
        formData.set('operations', JSON.stringify({
          query: update ? UPDATE_PLAYER_RAW : CREATE_PLAYER_RAW,
          variables: mutationVariables,
        }));

        formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
        formData.set('0', uploadedProfile.current);

        const token = getCookie('token');
        const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        playerRes = await response.json();

      } else {
        if (update && prevPlayer?._id) {
          playerRes = await updatePlayer({ variables: { input: playerUpdate, playerId: prevPlayer._id } });
        } else {
          playerRes = await addPlayer({ variables: { input: playerAddObj } });
        }
      }

      if (update) {
        mutateClient.refetchQueries({ include: [GET_EVENT_WITH_PLAYERS] });
      } else {
        client.refetchQueries({ include: [GET_EVENT_WITH_PLAYERS] });
      } if (playerRes && playerRes.data?.createPlayer?.code === 201 || playerRes.data?.updatePlayer?.code === 202) {
        if(!update){
          setPlayerAdd(initialPlayerAdd);
          const formEl = e.target as HTMLFormElement;
          formEl.reset();
        }
      } else {
        setActErr({ name: playerRes.data.createPlayer.code, message: playerRes.data.createPlayer.message, main: playerRes.data.createPlayer })
      }
      if (setAddPlayer && !update) setAddPlayer(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      if (update) {
        router.push(`/${eventId}/players/${prevPlayer?._id}`)
      }
    }

  }


  return (
    <form onSubmit={handleAddPlayer} className='flex justify-between items-center flex-wrap'>
      <FileInput handleFileChange={handleFileChange} name='profile' defaultValue={prevPlayer?.profile} extraCls='md:w-5/12' />
      <TextInput name='firstName' lblTxt='First Name' defaultValue={prevPlayer?.firstName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      <TextInput name='lastName' lblTxt='Last Name' defaultValue={prevPlayer?.lastName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      <EmailInput name='email' defaultValue={prevPlayer?.email} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      {!update && (<React.Fragment>
        <SelectInput name='division' optionList={divisionList} handleSelect={handleDivisionChange} lw="w-full" rw="w-full" vertical extraCls='md:w-5/12' />
        <SelectInput name='team' optionList={teamOptions} handleSelect={handleSelect} lw="w-full" rw="w-full" vertical extraCls='md:w-5/12' />
      </React.Fragment>)}
      {/* <Link className='underline underline-offset-8 w-full mt-4' href={`/${eventId}/teams/new`}>Create Team!</Link> */}
      <div className="input-group w-full">
        <button type="submit" className='btn-secondary mt-8'>{update ? "Save" : "Submit"}</button>
      </div>
    </form>
  )
}

export default PlayerAdd;