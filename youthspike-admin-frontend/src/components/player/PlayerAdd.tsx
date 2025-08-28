'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IOption, ITeam } from '@/types';
import { useMutation } from '@apollo/client';
import { CREATE_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDivisionFromStore, getTeamFromStore, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import ImageInput from '../elements/forms/ImageInput';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { useError } from '@/lib/ErrorProvider';
import InputField from '../elements/forms/InputField';
import Loader from '../elements/Loader';
import updatePlayerFn from '@/utils/requestHandlers/updatePlayerFn';
import createPlayer from '@/utils/requestHandlers/createPlayer';

interface IPlayerAddProps {
  eventId: string;
  teamList: ITeam[];
  division?: string;
  prevPlayer?: IPlayer | null;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  update?: boolean;
}

const initialPlayerAdd: IPlayerAdd = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  event: '',
  phone: '',
  division: '',
};

function PlayerAdd({ eventId, update, prevPlayer, setAddPlayer, teamList, division }: IPlayerAddProps) {
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  const [playerState, setPlayerState] = useState<IPlayerAdd>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<IPlayerAdd>>({});
  const [addPlayer] = useMutation(CREATE_PLAYER);
  const [updatePlayer] = useMutation(UPDATE_PLAYER);

  const uploadedProfile = useRef<File | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  const refetch = async () => {
    window.location.reload();
  };

  // Unified field updater
  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      const updater = update ? setPlayerUpdate : setPlayerState;
      updater((prev: IPlayerAdd) => ({ ...prev, [name]: value }));
    },
    [update],
  );

  const handleInputChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      handleFieldChange(inputEl.name, inputEl.value);
    },
    [handleFieldChange],
  );

  const handleTeamChange = useCallback(
    (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLSelectElement;
      setTeamToStore(inputEl.value);
      handleFieldChange(inputEl.name, inputEl.value);
    },
    [handleFieldChange],
  );

  const handleFileChange = useCallback((uploadedFile: Blob | MediaSource) => {
    uploadedProfile.current = uploadedFile as File;
  }, []);

  const handleAddPlayer = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (update) {
        updatePlayerFn({ setActErr, setIsLoading, playerUpdate, prevPlayer: prevPlayer || null, eventId, uploadedProfile, updatePlayer, router, ldoIdUrl, refetch, team: teamId });
      } else {
        createPlayer({ setActErr, setIsLoading, playerState, division, eventId, uploadedProfile, addPlayer, setPlayerState, initialPlayerAdd, setAddPlayer, router, e, ldoIdUrl, team: teamId });
      }
    },
    [setIsLoading, setActErr, playerState, division, eventId, uploadedProfile, playerUpdate, prevPlayer, updatePlayer, ldoIdUrl, addPlayer, router, update],
  );

  // Set initial state when editing
  useEffect(() => {
    if (update && prevPlayer) {
      setPlayerState({
        ...initialPlayerAdd,
        firstName: prevPlayer.firstName,
        lastName: prevPlayer.lastName,
        username: prevPlayer.username ?? '',
        email: prevPlayer.email,
        phone: prevPlayer.phone ? String(prevPlayer.phone) : '',
      });
    }
  }, [update, prevPlayer]);

  // Load from local storage once
  useEffect(() => {
    setPlayerState((prev) => ({
      ...prev,
      ...(getTeamFromStore() ? { team: getTeamFromStore()! } : {}),
      ...(getDivisionFromStore() ? { division: getDivisionFromStore()! } : {}),
    }));

    const teamExist = getTeamFromStore();
    setTeamId(teamExist || null);
  }, []);

  // Set director id
  useEffect(() => {
    if (user.info?.role === UserRole.admin) {
      const newDirectorId = searchParams.get('ldoId');
      if (!newDirectorId) {
        router.push('/admin');
        return;
      }
      setDirectorId(newDirectorId);
    } else {
      setDirectorId(user.info?._id ?? null);
    }
  }, [eventId, user]);

  // Memoized team options
  const teamOptions = useMemo<IOption[]>(() => teamList.map((t, i) => ({ id: i + 1, text: t.name, value: t._id })), [teamList]);

  if (isLoading) return <Loader />;

  return (
    <form onSubmit={handleAddPlayer} className="w-full">
      <ImageInput handleFileChange={handleFileChange} name="profile" defaultValue={prevPlayer?.profile || null} className="mt-6" />
      <div className="part-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <InputField type="text" name="firstName" label="First Name" defaultValue={playerState.firstName} handleInputChange={handleInputChange} required={!update} />
        <InputField type="text" name="lastName" label="Last Name" defaultValue={playerState.lastName} handleInputChange={handleInputChange} required={!update} />
        {update && <InputField type="text" name="username" defaultValue={playerState.username} handleInputChange={handleInputChange} required={false} />}
        <InputField type="email" name="email" defaultValue={playerState.email} handleInputChange={handleInputChange} required={false} />
        <InputField type="number" name="phone" defaultValue={playerState.phone} handleInputChange={handleInputChange} />
      </div>

      {!update && <SelectInput name="team" className="mt-6" value={playerState.team} optionList={teamOptions} handleSelect={handleTeamChange} />}

      <div className="input-group w-full mb-4">
        <button type="submit" className="btn-info mt-8 w-full">
          {update ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default PlayerAdd;
