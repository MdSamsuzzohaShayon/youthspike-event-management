import React, { useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import { IPlayerAdd } from '@/types/player';
import NumberInput from '../elements/forms/NumberInput';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption } from '@/types';
import { gql, useMutation } from '@apollo/client';
import { CREATE_PLAYER, GET_PLAYERS } from '@/graphql/players';
import EmailInput from '../elements/forms/EmailInput';

interface IPlayerAddProps {
  eventId: string,
  setIsLoading: (state: boolean) => void;
}

const initialPlayerAdd = {
  firstName: '',
  lastName: '',
  email: '',
  event: '',
  // team: '',
  rank: "1"
};
const eventOption: IOption[] = [{ text: 'Team 1', value: 't1' }, { text: 'Team 2', value: 't2' }];

function PlayerAdd({ eventId, setIsLoading }: IPlayerAddProps) {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [playerAdd, setPlayerAdd] = useState<IPlayerAdd>(initialPlayerAdd);
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


  const handleAddPlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const playerAddObj = structuredClone(playerAdd);
      playerAddObj.event = eventId;
      const playerRes = await addPlayer({ variables: { input: playerAddObj } });
      if (playerRes.data.createPlayer.code === 201) {
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

  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setPlayerAdd(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
  }

  const handleSelect = (e: React.SyntheticEvent) => { }


  return (
    <div>
      <form onSubmit={handleAddPlayer}>
        <TextInput name='firstName' lblTxt='First Name' defaultValue={playerAdd.firstName} handleInputChange={handleInputChange} required vertical />
        <TextInput name='lastName' lblTxt='Last Name' defaultValue={playerAdd.lastName} handleInputChange={handleInputChange} required vertical />
        <EmailInput name='email' defaultValue={playerAdd.email} handleInputChange={handleInputChange} required vertical />
        {/* <NumberInput name='rank' defaultValue={playerAdd.rank ? playerAdd.rank : null} handleInputChange={handleInputChange} lw="w-full" rw="w-full" required vertical /> */}
        <SelectInput name='team' optionList={eventOption} handleSelect={handleSelect} lw="w-full" rw="w-full" vertical />
        <button type="submit" className='btn-secondary'>Submit</button>
      </form>
    </div>
  )
}

export default PlayerAdd