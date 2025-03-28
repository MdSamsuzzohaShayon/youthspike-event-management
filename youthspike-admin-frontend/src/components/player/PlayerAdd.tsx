'use client'

import React, { useEffect, useRef, useState } from 'react';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IOption, ITeam } from '@/types';
import { useMutation } from '@apollo/client';
import { CREATE_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDivisionFromStore, getTeamFromStore, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import addOrUpdatePlayer from '@/utils/requestHandlers/addOrUpdatePlayer';
import ImageInput from '../elements/forms/ImageInput';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { useError } from '@/lib/ErrorContext';
import InputField from '../elements/forms/InputField';

interface IPlayerAddProps {
  eventId: string,
  prevPlayer?: IPlayer | null;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  teamList: ITeam[];
  division?: string;
  update?: boolean;
  playerAddCB?: (playerData: IPlayerExpRel) => void;
}

const initialPlayerAdd = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  event: '',
  phone: '',
  rank: "0",
  division: ''
};

function PlayerAdd({ eventId, update, prevPlayer, setAddPlayer, teamList, division, playerAddCB }: IPlayerAddProps) {


  // React Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();


  // ===== local States =====
  const [playerState, setPlayerState] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer, { data, client }] = useMutation(CREATE_PLAYER);
  const uploadedProfile = useRef<File | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);
  // setIsLoading={setIsLoading}
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [updatePlayer, { data: puData, client: mutateClient }] = useMutation(UPDATE_PLAYER);

  /// ===== input Change =====
  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (update) {
      setPlayerUpdate(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setPlayerState(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  }

    // ======  Callback functions ====== 
    const playerUpdateCB = (playerData: IPlayerExpRel) => { }
  
    const refetchFunc= async ()=>{
      // await refetch();
    }

  const handleFileChange = (uploadedFile: Blob | MediaSource) => {
    // @ts-ignore
    uploadedProfile.current = uploadedFile;
  }

  const handleTeamChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setTeamToStore(inputEl.value);
    if (update) {
      setPlayerUpdate(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setPlayerState(prevState => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };


  /**
   * Create or update player
   */
  const handleAddPlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    addOrUpdatePlayer({
      setIsLoading, setActErr, playerState, division, eventId, uploadedProfile, playerUpdate,
      prevPlayer, updatePlayer, ldoIdUrl, addPlayer, playerAddCB, playerUpdateCB, setPlayerState, initialPlayerAdd, setAddPlayer, router, e, update, refetchFunc
    });
  }

  // Setting default player initially when update
  useEffect(() => {
    if (update && prevPlayer) {
      const pObj = { ...initialPlayerAdd };
      pObj.firstName = prevPlayer.firstName;
      pObj.lastName = prevPlayer.lastName;
      pObj.username = prevPlayer.username ?? '';
      pObj.email = prevPlayer.email;
      pObj.phone = prevPlayer.phone ? prevPlayer.phone.toString() : '';
      setPlayerState(pObj);
    }
  }, [update, prevPlayer]);

  // Setting player with team and division from local storage
  useEffect(() => {
    const tdObj: { team?: string; division?: string } = {};
    const teamExist = getTeamFromStore();
    if (teamExist) tdObj.team = teamExist;
    const divisionExist = getDivisionFromStore();
    if (divisionExist) tdObj.division = divisionExist;
    setPlayerState((prevState) => ({ ...prevState, ...tdObj }));
  }, []);

  // Setting director Id from query params
  useEffect(() => {
    if (user.info?.role === UserRole.admin) {
      const newDirectorId = searchParams.get('ldoId');
      if (!newDirectorId) {
        router.push('/admin');
        return;
      }
      setDirectorId(newDirectorId);
    } else {
      setDirectorId(user.info?._id ? user.info._id : null);
    }
  }, [eventId, user]);


  return (
    <form onSubmit={handleAddPlayer} className='w-full'>
      <ImageInput handleFileChange={handleFileChange} name='profile' defaultValue={prevPlayer?.profile || ''} className='mt-6' />
      <div className='part-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
        <InputField type="text" name='firstName' label='First Name' defaultValue={playerState?.firstName}
          handleInputChange={handleInputChange} required={!update} />
        <InputField type="text" name='lastName' label='Last Name' defaultValue={playerState?.lastName}
          handleInputChange={handleInputChange} required={!update} />
        {update && <InputField type='text' name='username' defaultValue={playerState?.username} handleInputChange={handleInputChange} required={!update} />}
        <InputField type="email" key="eml-pa-1" name='email' defaultValue={playerState?.email} handleInputChange={handleInputChange} required={false} />
        <InputField type="number" key="nml-pa-2" name='phone' defaultValue={playerState?.phone} handleInputChange={handleInputChange} />
      </div>
      {!update && (<React.Fragment>
        <SelectInput key="player-add-1" defaultValue={playerState.team} name='team' className='mt-6'
          optionList={teamList.map((t, tI): IOption => ({ id: tI + 1, text: t.name, value: t._id }))} handleSelect={handleTeamChange} />
      </React.Fragment>)}

      <div className="input-group w-full mb-4">
        <button type="submit" className='btn-info mt-8'>{update ? "Update" : "Create"}</button>
      </div>
    </form>
  )
}

export default PlayerAdd;