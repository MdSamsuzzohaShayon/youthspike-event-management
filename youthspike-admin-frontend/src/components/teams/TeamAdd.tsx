import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IOption, IPlayer, ITeamAdd, IGroup, ITeam, IGetTeamResponse, IEvent } from '@/types';
import { ADD_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import SelectInput from '../elements/forms/SelectInput';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import { useLdoId } from '@/lib/LdoProvider';
import Link from 'next/link';
import { useMessage } from '@/lib/MessageProvider';
import InputField from '../elements/forms/InputField';
import ImageInput from '../elements/forms/ImageInput';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';
import updateTeam from '@/utils/request-handlers/updateTeam';
import createTeam from '@/utils/request-handlers/createTeam';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import GenericMultiSelect from '../elements/forms/GenericMultiSelect';
import SessionStorageService from '@/utils/SessionStorageService';



interface ITeamAddProps {
  players: IPlayer[];
  groupList: IGroup[];
  handleClose: (e: React.SyntheticEvent) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currDivision?: string;
  update?: boolean;
  prevTeam?: ITeam;
  events: IEvent[];
}

const initialTeamState: ITeamAdd = {
  active: true,
  name: '',
  logo: null,
  events: [],
  division: '',
  players: [],
  captain: '',
};

function TeamAdd({ groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, events }: ITeamAddProps) {
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();
  const router = useRouter();
  const apolloClient = useApolloClient();

  // Helper function to transform ITeam to ITeamAdd format
  const transformTeamToTeamAdd = (team: ITeam): ITeamAdd => {
    const teamObj: ITeamAdd = {
      active: team.active,
      name: team.name,
      logo: team.logo ?? null,
      division: team.division,
      players: [],
      captain: team?.captain?._id || null,
      events: events.map((e) => e._id)
    }
    return teamObj;
  };

  const [teamState, setTeamState] = useState<ITeamAdd>(
    prevTeam ? transformTeamToTeamAdd(prevTeam) : initialTeamState
  );
  const [updateTeamState, setUpdateTeamState] = useState<Partial<ITeamAdd>>({});
  const [playerIdList, setPlayerIdList] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
  const [availableAddition, setAvailableAdition] = useState(false);

  const uploadedLogo = useRef<null | MediaSource | Blob>(null);

  // GraphQL
  const [addTeam, { data, loading, error }] = useMutation<{ createTeam: IGetTeamResponse }>(ADD_A_TEAM);
  const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation<{ updateTeam: IGetTeamResponse }>(UPDATE_TEAM);


  // Handle events
  const handleTeamAdd = async (e: React.SyntheticEvent, createAgain: boolean) => {
    e.preventDefault();

    if (update) {
      await updateTeam({
        prevTeam: prevTeam ? { ...transformTeamToTeamAdd(prevTeam), _id: prevTeam._id } : null,
        updateTeamState,
        setMessage,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        apolloClient,
        mutateTeam,
        events: events.map((e) => e._id),
      });
      const formEl = e.target as HTMLFormElement;
      formEl.reset();
      handleClose(e);
    } else {
      // Need to test this caching and redirecting
      await createTeam({
        teamState,
        setMessage,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        addTeam,
        apolloClient,
        events: events.map((e) => e._id)
      });
    }

    if (!createAgain) {
      router.push(`/teams/${ldoIdUrl}`);
    }
  };



  const handleInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement | HTMLSelectElement;
    setTeamState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    if (update) {
      setUpdateTeamState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const makeOptionList = (ap: IPlayer[]): IOption[] => {
    const newPlayerList: IOption[] = [];
    for (let i = 0; i < ap.length; i += 1) {
      newPlayerList.push({
        id: i + 1,
        text: ap[i].firstName + ' ' + ap[i].lastName,
        value: ap[i]._id,
      });
    }
    return newPlayerList;
  };

  const handleCheckboxChange = (playerId: string, isChecked: boolean) => {
    if (isChecked) {
      setPlayerIdList((prevState) => [...new Set([...prevState, playerId])]);
    } else {
      setPlayerIdList((prevState) => prevState.filter((p) => p !== playerId));
    }
  };

  const handleFileChange = (uploadedFile: MediaSource | Blob) => {
    uploadedLogo.current = uploadedFile;
  };

  const handleEventSelectionChange = (selectedIds: string[]) => {
    setTeamState((prevState) => ({ ...prevState, events: selectedIds }));
    if (update) {
      setUpdateTeamState((prevState) => ({ ...prevState, events: selectedIds }));
    }
  }


  // Memoization
  const toBeCaptains = useMemo(() => {
    const playersWithEmail = availablePlayers.filter((ap) => playerIdList.includes(ap._id) && ap.email && ap.email.trim() !== '');
    const options = makeOptionList(playersWithEmail);
    return <SelectInput name="captain" optionList={options && options.length > 0 ? options : []} handleSelect={handleInputChange} />;
  }, [availablePlayers, playerIdList]);

  const eventIds = useMemo(() => {
    return events.map((e) => e._id)
  }, [events]);


  const divisionOptions = useMemo(() => {
    const divisions = divisionsOfEvents(events);
    return divisionsToOptionList(divisions);
  }, [events]);


  useEffect(() => {
    setAvailablePlayers(players || []);
  }, [players]);


  useEffect(() => {
    const eventId = SessionStorageService.getItem<string>('event');
    if (!eventId) return;
    setTeamState((prevState) => {
      const nextEvents = [...new Set([...(prevState.events ?? []), eventId])];
      return { ...prevState, events: nextEvents };
    });
    if (update) {
      setUpdateTeamState((prevState) => ({
        ...prevState,
        events: [...new Set([...(prevState.events ?? teamState.events ?? []), eventId])],
      }));
    }
  }, []);
  


  return (
    <form onSubmit={(e) => handleTeamAdd(e, false)} className="flex flex-col gap-2">
      <InputField type="text" name="name" required={!update} defaultValue={teamState.name} className="mt-6" onChange={handleInputChange} />
      {/* // List of all events  */}

      <GenericMultiSelect<IEvent & { id: string }>
        label="Select Events"
        items={events.map((event) => ({
          ...event,
          id: event._id,
        }))}
        defaultSelectedIds={teamState.events}
        getItemLabel={(event) =>
          `${event.name}`
        }
        searchBy={(event) => [
          event.name,
          event.description,
        ]}
        onSelectionChange={handleEventSelectionChange}
      />

      {divisionOptions.length > 0 && (
        <SelectInput key="d-t-d-1" defaultValue={currDivision || teamState?.division} handleSelect={handleInputChange} name="division" className="mt-6" optionList={divisionOptions} />
      )}

      <SelectInput
        key="g-t-d"
        required={!update}
        handleSelect={handleInputChange}
        name="group"
        className="mt-6"
        // {...(prevTeam?.group ? { defaultValue: prevTeam?.group?._id || String(prevTeam?.group) } : {})}
        optionList={
          teamState.division && teamState.division !== ''
            ? groupList.filter((g) => g.division.trim().toUpperCase() === teamState.division.trim().toUpperCase()).map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
            : groupList.map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
        }
      />
      {events.map((event) => (
        <Link key={event._id} className="underline underline-offset-1" href={`/${event._id}/groups/new/${ldoIdUrl}`}>
          Create new group in {event.name}
        </Link>
      ))}

      <div className="w-full md:w-2/6">
        <ImageInput name="logo" defaultValue={teamState.logo} onFileChange={handleFileChange} />
      </div>

      {!update ? (
        <div className="player-input mb-4">
          <PlayerSelectInput players={availablePlayers} events={eventIds} onCheckboxChange={handleCheckboxChange} name="player-select" />
        </div>
      ) : (<div className="player-input mb-4">
        <button type='button' className="btn-info" onClick={() => setAvailableAdition((prev) => !prev)}> {availableAddition ? "Hide players" : "Add Players"}</button>
        {availableAddition && <PlayerSelectInput players={availablePlayers} events={eventIds} onCheckboxChange={handleCheckboxChange} name="player-select" />}
      </div>)}
      {playerIdList.length > 0 && !update && toBeCaptains}

      <div className="input-group w-full mb-4">
        <button className="btn-info mr-2" type="submit">
          {update ? 'Update' : 'Save'}
        </button>
        {!update && (
          <button className="btn-info" type="button" onClick={(e) => handleTeamAdd(e, true)}>
            Save & Create Another
          </button>
        )}
      </div>
    </form>
  );
}

export default TeamAdd;
