'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { IPlayer, IPlayerAdd, IUpdatePlayerRes } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import { IEvent, IGetPlayerResponse, IOption, IResponse, ITeam, ITeamRelatives, TAddPlayer } from '@/types';
import { CREATE_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTeamToStore } from '@/utils/localStorage';
import SessionStorageService from '@/utils/SessionStorageService';
import ImageInput from '../elements/forms/ImageInput';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import InputField from '../elements/forms/InputField';
import Loader from '../elements/Loader';
import updatePlayerFn from '@/utils/request-handlers/updatePlayerFn';
import createPlayer from '@/utils/request-handlers/createPlayer';
import { CURRENT_EVENT, DIVISION, TEAM } from '@/utils/constant';
import { useApolloClient, useMutation } from '@apollo/client/react';
import GenericMultiSelect from '../elements/forms/GenericMultiSelect';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';

interface IPlayerAddProps {
  teams: ITeamRelatives[];
  events?: IEvent[];
  prevPlayer?: IPlayer | null;
  update?: boolean;
}




const initialPlayerAdd: TAddPlayer = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  events: [],
  teams: [],
  phone: '',
  division: '',
};

function PlayerAdd({ update, prevPlayer, teams, events }: IPlayerAddProps) {
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();
  const apolloClient = useApolloClient();

  // State
  const [playerState, setPlayerState] = useState<TAddPlayer>(initialPlayerAdd);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<TAddPlayer>>({});

  const uploadedProfile = useRef<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const [addPlayer] = useMutation<{ createPlayer: IGetPlayerResponse }>(CREATE_PLAYER);
  const [updatePlayer] = useMutation<{ updatePlayer: IUpdatePlayerRes }>(UPDATE_PLAYER);




  // Unified field updater

  const handleInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement | HTMLSelectElement;
    setPlayerState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    if (update) {
      setPlayerUpdate((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };



  const handleFileChange = useCallback((uploadedFile: Blob | MediaSource) => {
    uploadedProfile.current = uploadedFile as File;
  }, []);



  // -------------------- Memoized Values --------------------
  const divisionOptions = useMemo(() => {
    if (!playerState.events) {
      return [];
    }
    // According to selected events divisions will be shown
    const selectedEventSet = new Set<string>(playerState.events);
    const selectedEvents = (events || []).filter((e) => selectedEventSet.has(e._id));
    const divisions = divisionsOfEvents(selectedEvents);
    return divisionsToOptionList(divisions);
  }, [events, playerState.events]);

  const teamOptions = useMemo(() => {
    if (playerState.events?.length === 0) return [];

    const eventSet = new Set<string>(playerState.events);
    const list = [];
    let i = 0;
    for (const team of teams) {
      if (!team.events) continue;
      let found = false;
      for (const e of team.events) {
        if (eventSet.has(e)) {
          found = true;
          continue;
        }
      }
      if (found) {
        list.push({ id: i + 1, value: team._id, text: team.name });
        i += 1;
      }
    }

    return list;
  }, [teams, playerState.events]);



  // -------------------- Handlers --------------------
  const handleDivisionChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    const division = inputEl.value.trim();

    if (!division) {
      SessionStorageService.removeItem(DIVISION);
      return;
    }

    SessionStorageService.setItem(DIVISION, division);
    setPlayerState((prevState) => ({ ...prevState, division }));
    if (update) {
      setPlayerUpdate((prevState) => ({ ...prevState, division }));
    }
  };

  const handleEventChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setPlayerState((prevState) => ({ ...prevState, events: [inputEl.value] }));
    if (update) {
      setPlayerUpdate((prevState) => ({ ...prevState, events: [inputEl.value] }));
    }
  }

  const handleTeamChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setPlayerState((prevState) => ({ ...prevState, teams: !inputEl.value || inputEl.value === '' ? [] :[inputEl.value] }));
    if (update) {
      setPlayerUpdate((prevState) => ({ ...prevState, teams: !inputEl.value || inputEl.value === '' ? [] :[inputEl.value] }));
    }
  }




  const handleAddPlayer = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (update) {
      updatePlayerFn({ setMessage, setIsLoading, playerUpdate, prevPlayer: prevPlayer || null, uploadedProfile, updatePlayer });
    } else {
      createPlayer({ setMessage, apolloClient, setIsLoading, playerState, uploadedProfile, addPlayer });
    }


    // Check session storage
    if (playerState.teams && playerState.teams.length > 0) {
      router.push(`/teams/${playerState.teams[0]}/roster/${ldoIdUrl}`);
    } else {
      const currentEvent = SessionStorageService.getItem(CURRENT_EVENT);
      if (currentEvent) {
        router.push(`/${currentEvent}/players/${ldoIdUrl}`);
      } else {
        router.push(`/players/${ldoIdUrl}`);

      }
    }
  };



  // Set initial previous player object for updating
  useEffect(() => {
    if (update && prevPlayer) {
      setPlayerState(prevPlayer);
    }
  }, [update, prevPlayer]);


  useEffect(() => {
    if (update) return;
    const division = SessionStorageService.getItem(DIVISION);

    const initialValue: Partial<TAddPlayer> = {};
    if (division) {
      initialValue.division = division as string;
    }
    const currentEvent = SessionStorageService.getItem(CURRENT_EVENT);
    if (currentEvent) {
      initialValue.events = [currentEvent as string];
    }


    const team = SessionStorageService.getItem(TEAM);
    if(team){
      initialValue.teams = [team as string];
    }

    setPlayerState((prev) => ({ ...prev, ...initialValue }));
  }, [update, teams]);

  if (isLoading) return <Loader />;

  return (
    <form onSubmit={handleAddPlayer} className="w-full">
      <ImageInput onFileChange={handleFileChange} name="profile" defaultValue={prevPlayer?.profile || null} className="mt-6 w-full md:w-2/6" />

      <SelectInput name='events' value={playerState.events && playerState.events.length > 0 ? playerState.events[0] : null}
        optionList={(events || [])?.map((e, i) => ({ id: i + 1, value: e._id, text: e.name }))} handleSelect={handleEventChange} />


      <div className="mt-2 division-selection w-full">
        <SelectInput key="division-selector-add" name="division" value={playerState?.division} optionList={divisionOptions} handleSelect={handleDivisionChange} />
      </div>

      <div className="part-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <InputField type="text" name="firstName" label="First Name" defaultValue={playerState.firstName} onChange={handleInputChange} required={!update} />
        <InputField type="text" name="lastName" label="Last Name" defaultValue={playerState.lastName} onChange={handleInputChange} required={!update} />
        {update && <InputField type="text" name="username" defaultValue={playerState.username} onChange={handleInputChange} required={false} />}
        <InputField type="email" name="email" defaultValue={playerState.email} onChange={handleInputChange} required={false} />
        <InputField type="number" name="phone" defaultValue={playerState.phone} onChange={handleInputChange} />
      </div>


      {teamOptions.length > 0 && (
        <SelectInput name='teams' value={playerState.teams && playerState.teams.length > 0 ? playerState.teams[0] as string : null}
          optionList={teamOptions} handleSelect={handleTeamChange} />
      )}




      <div className="input-group w-full mb-4">
        <button type="submit" className="btn-info mt-8 w-full">
          {update ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default PlayerAdd;
