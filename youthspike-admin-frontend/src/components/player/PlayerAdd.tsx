import React, { useEffect, useRef, useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption, ITeam, ITeamAdd } from '@/types';
import { RefetchQueriesFunction, gql, useMutation } from '@apollo/client';
import { CREATE_PLAYER, GET_PLAYERS, CREATE_PLAYER_RAW, UPDATE_PLAYER_RAW, UPDATE_PLAYER, GET_EVENT_WITH_PLAYERS } from '@/graphql/players';
import EmailInput from '../elements/forms/EmailInput';
import FileInput from '../elements/forms/FileInput';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { useRouter } from 'next/navigation';
import { getDivisionFromStore, getTeamFromStore, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import addOrUpdatePlayer from '@/utils/requestHandlers/addOrUpdatePlayer';
import NumberInput from '../elements/forms/NumberInput';

interface IPlayerAddProps {
  eventId: string,
  prevPlayer?: IPlayer | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  teamList: ITeam[];
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  division?: string;
  update?: boolean;
  playerAddCB?: (playerData: IPlayerExpRel) => void;
  playerUpdateCB?: (playerData: IPlayerExpRel) => void;
  refetchFunc?: () =>Promise<void>;
}

const initialPlayerAdd = {
  firstName: '',
  lastName: '',
  email: '',
  event: '',
  phone: '',
  rank: "0",
  division: ''
};

function PlayerAdd({ eventId, setIsLoading, update, prevPlayer, setAddPlayer, teamList, setActErr, division, playerAddCB, playerUpdateCB, refetchFunc }: IPlayerAddProps) {


  // React Hooks
  const router = useRouter();

  // ===== local States =====
  const [playerState, setPlayerState] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer, { data, client }] = useMutation(CREATE_PLAYER);
  const uploadedProfile = useRef<File | null>(null);

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

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      uploadedProfile.current = inputEl.files[0];
    }
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
      prevPlayer, updatePlayer, addPlayer, playerAddCB, playerUpdateCB, setPlayerState, initialPlayerAdd, setAddPlayer, router, e, update, refetchFunc
    });
  }

  useEffect(() => {
    if (update && prevPlayer) {
      const pObj = { ...initialPlayerAdd };
      pObj.firstName = prevPlayer.firstName;
      pObj.lastName = prevPlayer.lastName;
      pObj.email = prevPlayer.email;
      setPlayerState(pObj);
    }
  }, [update, prevPlayer]);

  useEffect(() => {
    const tdObj: { team?: string; division?: string } = {};
    const teamExist = getTeamFromStore();
    if (teamExist) tdObj.team = teamExist;
    const divisionExist = getDivisionFromStore();
    if (divisionExist) tdObj.division = divisionExist
    setPlayerState((prevState) => ({ ...prevState, ...tdObj }));
  }, []);


  return (
    <form onSubmit={handleAddPlayer} className='flex justify-between items-center flex-wrap'>
      <FileInput handleFileChange={handleFileChange} name='profile' defaultValue={prevPlayer?.profile} extraCls='md:w-5/12' />
      <TextInput name='firstName' lblTxt='First Name' defaultValue={playerState?.firstName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      <TextInput name='lastName' lblTxt='Last Name' defaultValue={playerState?.lastName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      <EmailInput name='email' defaultValue={playerState?.email} handleInputChange={handleInputChange} required={false} vertical extraCls='md:w-5/12' />
      <NumberInput name='phone' defaultValue={null} handleInputChange={handleInputChange} vertical extraCls='md:w-5/12' />
      {!update && (<React.Fragment>
        <SelectInput key={crypto.randomUUID()} defaultValue={playerState.team} name='team' optionList={teamList.map((t): IOption => ({ text: t.name, value: t._id }))} handleSelect={handleTeamChange} lw="w-full" rw="w-full" vertical extraCls='md:w-5/12' />
      </React.Fragment>)}
      <div className="input-group w-full mb-4">
        <button type="submit" className='btn-secondary mt-8'>{update ? "Save" : "Submit"}</button>
      </div>
    </form>
  )
}

export default PlayerAdd;