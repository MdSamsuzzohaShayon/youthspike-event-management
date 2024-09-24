import React, { useEffect, useRef, useState } from 'react'
import TextInput from '../elements/forms/TextInput';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption, ITeam } from '@/types';
import { useMutation } from '@apollo/client';
import { CREATE_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import EmailInput from '../elements/forms/EmailInput';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDivisionFromStore, getTeamFromStore, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import addOrUpdatePlayer from '@/utils/requestHandlers/addOrUpdatePlayer';
import NumberInput from '../elements/forms/NumberInput';
import ImageInput from '../elements/forms/ImageInput';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';

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
  refetchFunc?: () => Promise<void>;
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

function PlayerAdd({ eventId, setIsLoading, update, prevPlayer, setAddPlayer, teamList, setActErr, division, playerAddCB, playerUpdateCB, refetchFunc }: IPlayerAddProps) {


  // React Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();

  // ===== local States =====
  const [playerState, setPlayerState] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer, { data, client }] = useMutation(CREATE_PLAYER);
  const uploadedProfile = useRef<File | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);

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
      prevPlayer, updatePlayer, directorId, addPlayer, playerAddCB, playerUpdateCB, setPlayerState, initialPlayerAdd, setAddPlayer, router, e, update, refetchFunc
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
    <form onSubmit={handleAddPlayer} className='flex justify-between items-center flex-wrap'>
      <div className="w-full">
        <ImageInput handleFileChange={handleFileChange} name='profile' defaultValue={prevPlayer?.profile} extraCls='md:w-5/12' />
      </div>
      <TextInput name='firstName' lblTxt='First Name' defaultValue={playerState?.firstName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      <TextInput name='lastName' lblTxt='Last Name' defaultValue={playerState?.lastName} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />
      {update && <TextInput name='username' defaultValue={playerState?.username} handleInputChange={handleInputChange} required={!update} vertical extraCls='md:w-5/12' />}
      <EmailInput key="eml-pa-1" name='email' defaultValue={playerState?.email} handleInputChange={handleInputChange} required={false} vertical extraCls='md:w-5/12' />
      <NumberInput name='phone' defaultValue={playerState?.phone} handleInputChange={handleInputChange} vertical extraCls='md:w-5/12' />
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