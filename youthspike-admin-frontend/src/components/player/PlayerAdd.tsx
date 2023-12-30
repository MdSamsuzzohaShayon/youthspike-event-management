import React, { useRef, useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import { IPlayer, IPlayerAdd } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption } from '@/types';
import { gql, useMutation } from '@apollo/client';
import { CREATE_PLAYER, GET_PLAYERS, CREATE_PLAYER_RAW, UPDATE_PLAYER_RAW, UPDATE_PLAYER } from '@/graphql/players';
import EmailInput from '../elements/forms/EmailInput';
import Link from 'next/link';
import FileInput from '../elements/forms/FileInput';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';

interface IPlayerAddProps {
  eventId: string,
  update: boolean;
  prevPlayer?: IPlayer | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialPlayerAdd = {
  firstName: '',
  lastName: '',
  email: '',
  event: '',
  // team: '',
  rank: "0"
};
const eventOption: IOption[] = [{ text: 'Team 1', value: 't1' }, { text: 'Team 2', value: 't2' }];

function PlayerAdd({ eventId, setIsLoading, update, prevPlayer }: IPlayerAddProps) {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [playerAdd, setPlayerAdd] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer, { data }] = useMutation(CREATE_PLAYER, {

    /*
    update(cache, { data: { createPlayer } }) {
      console.log({createPlayer});
      
      cache.modify({
        fields: {
          players(existingPlayers = []) {
            const newPlayerRef = cache.writeFragment({
              data: createPlayer.data,
              fragment: gql`
                fragment NewPlayer on Player {
                  id
                  type
                }
                `
              });
            return [...existingPlayers, newPlayerRef];
          }
        }
      });
    }
    */
  });
  const [updatePlayer, { data: puData }] = useMutation(UPDATE_PLAYER);

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

  const handleSelect = (e: React.SyntheticEvent) => { }

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
        if(update) mutationVariables.playerId = prevPlayer?._id;
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
      if (playerRes && playerRes.data.createPlayer.code === 201) {
        setPlayerAdd(initialPlayerAdd);
        const formEl = e.target as HTMLFormElement;
        formEl.reset();
      } else {
        setActErr({ name: playerRes.data.createPlayer.code, message: playerRes.data.createPlayer.message, main: playerRes.data.createPlayer })
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }

  }


  return (
    <form onSubmit={handleAddPlayer}>
      <FileInput handleFileChange={handleFileChange} name='profile' defaultValue={prevPlayer?.profile} />
      <TextInput name='firstName' lblTxt='First Name' defaultValue={prevPlayer?.firstName} handleInputChange={handleInputChange} required={!update} vertical />
      <TextInput name='lastName' lblTxt='Last Name' defaultValue={prevPlayer?.lastName} handleInputChange={handleInputChange} required={!update} vertical />
      <EmailInput name='email' defaultValue={prevPlayer?.email} handleInputChange={handleInputChange} required={!update} vertical />
      {/* <NumberInput name='rank' defaultValue={playerAdd.rank ? playerAdd.rank : null} handleInputChange={handleInputChange} lw="w-full" rw="w-full" required={!update} vertical /> */}
      <SelectInput name='team' optionList={eventOption} handleSelect={handleSelect} lw="w-full" rw="w-full" vertical />
      <Link className='underline underline-offset-8' href={`/${eventId}/teams/new`}>Create Team!</Link>
      <div className="input-group w-full">
        <button type="submit" className='btn-secondary mt-8'>Submit</button>
      </div>
    </form>
  )
}

export default PlayerAdd;