import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IOption, IPlayer, IGroup, ITeam, IGetTeamResponse, IEvent, TAddTeam } from '@/types';
import { ADD_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import SelectInput from '../elements/forms/SelectInput';
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
import { CURRENT_EVENT } from '@/utils/constant';



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

const initialTeamState: TAddTeam = {
  active: true,
  name: '',
  logo: null,
  division: '',
  captain: '',
  cocaptain: null,
  events: [],
  players: [],
  groups: [],
  sendCredentials: false,
};

function TeamAdd({ groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, events }: ITeamAddProps) {
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();
  const router = useRouter();
  const apolloClient = useApolloClient();

  const [teamState, setTeamState] = useState<TAddTeam>(initialTeamState);
  const [updateTeamState, setUpdateTeamState] = useState<Partial<TAddTeam>>({});
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
        prevTeam: prevTeam ? { ...prevTeam, _id: prevTeam._id } as ITeam : null,
        updateTeamState,
        setMessage,
        setIsLoading,
        uploadedLogo,
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
        addTeam,
        apolloClient,
        events: events.map((e) => e._id)
      });
    }

    if (!createAgain) {
      const currentEvent = SessionStorageService.getItem(CURRENT_EVENT);
      if (currentEvent) {
        router.push(`/${currentEvent}/teams/${ldoIdUrl}`);
      } else {
        router.push(`/teams/${ldoIdUrl}`);
      }
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


  const handleFileChange = (uploadedFile: MediaSource | Blob) => {
    uploadedLogo.current = uploadedFile;
  };

  const handleEventSelectionChange = (selectedIds: string[]) => {
    setTeamState((prevState) => ({ ...prevState, events: selectedIds }));
    if (update) {
      setUpdateTeamState((prevState) => ({ ...prevState, events: selectedIds }));
    }
  }


  const handlePlayerSelectionChange = (selectedIds: string[]) => {
    setTeamState((prevState) => ({ ...prevState, players: selectedIds }));
    if (update) {
      setUpdateTeamState((prevState) => ({ ...prevState, players: selectedIds }));
    }
  }


  // Memoization
  const toBeCaptains = useMemo(() => {
    const playersWithEmail = availablePlayers.filter((ap) => teamState.players?.includes(ap._id) && ap.email && ap.email.trim() !== '');
    const options = makeOptionList(playersWithEmail);
    return <SelectInput name="captain" optionList={options && options.length > 0 ? options : []} handleSelect={handleInputChange} />;
  }, [availablePlayers, teamState.players]);



  const divisionOptions = useMemo(() => {
    if (!teamState.events) {
      const divisions = divisionsOfEvents(events);
      return divisionsToOptionList(divisions);
    }
    // According to selected events divisions will be shown
    const selectedEventSet = new Set<string>(teamState.events);
    const selectedEvents = events.filter((e) => selectedEventSet.has(e._id));
    const divisions = divisionsOfEvents(selectedEvents);
    return divisionsToOptionList(divisions);
  }, [events, teamState.events]);









  useEffect(() => {
    if (prevTeam) {
      const normalizeTeam: TAddTeam = {
        ...prevTeam,
        events: prevTeam.events?.map((e) => typeof e === 'object' ? e._id : String(e)),
        matches: prevTeam.matches?.map((e) => typeof e === 'object' ? e._id : String(e)),
        players: prevTeam.players?.map((e) => typeof e === 'object' ? e._id : String(e)),
        groups: prevTeam?.groups ? prevTeam.groups.map((e) => typeof e === 'object' ? e._id : String(e)) : [],
        captain: prevTeam?.captain ? (typeof prevTeam.captain === 'object' ? prevTeam.captain._id : String(prevTeam.captain)) : null,
        cocaptain: prevTeam?.cocaptain ? (typeof prevTeam.cocaptain === 'object' ? prevTeam.cocaptain._id : String(prevTeam.cocaptain)) : null,
      };
      setTeamState(normalizeTeam);
    }
  }, [prevTeam]);

  useEffect(() => {
    setAvailablePlayers(players || []);
  }, [players]);


  useEffect(() => {
    const currentEvent = SessionStorageService.getItem(CURRENT_EVENT);
    if (currentEvent) {
      setTeamState((prev) => ({ ...prev, events: [...new Set([...(prev?.events || []) as string[], currentEvent])] as string[] }));
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
        optionList={
          teamState.division && teamState.division && teamState.division !== ''
            ? groupList.filter((g) => teamState.division && g.division.trim().toUpperCase() === teamState.division.trim().toUpperCase()).map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
            : groupList.map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
        }
      />
      <div className="w-full flex justify-start items-center flex-wrap gap-x-4">
        {events.map((event) => (
          <Link key={event._id} className="underline underline-offset-1 hover:text-yellow-400" href={`/${event._id}/groups/new/${ldoIdUrl}`}>
            Create new group in {event.name}
          </Link>
        ))}
      </div>

      <div className="w-full md:w-2/6">
        <ImageInput name="logo" defaultValue={teamState.logo} onFileChange={handleFileChange} />
      </div>

      {availablePlayers.length > 0 && (<>
        {!update ? (
          <div className="player-input mb-4">
            <GenericMultiSelect<IPlayer & { id: string }>
              label="Select Players"
              items={availablePlayers.map((player) => ({
                ...player,
                id: player._id,
              }))}
              defaultSelectedIds={teamState.players}
              getItemLabel={(player) =>
                `${player.firstName} ${player.lastName}`
              }
              searchBy={(player) => [
                player.firstName,
                player.lastName,
              ]}
              onSelectionChange={handlePlayerSelectionChange}
            />
          </div>
        ) : (<div className="player-input mb-4">
          <button type='button' className="btn-info" onClick={() => setAvailableAdition((prev) => !prev)}> {availableAddition ? "Hide players" : "Add Players"}</button>
          {availableAddition && (
            <GenericMultiSelect<IPlayer & { id: string }>
              label="Select Players"
              items={availablePlayers.map((player) => ({
                ...player,
                id: player._id,
              }))}
              defaultSelectedIds={teamState.players}
              getItemLabel={(player) =>
                `${player.firstName} ${player.lastName}`
              }
              searchBy={(player) => [
                player.firstName,
                player.lastName,
              ]}
              onSelectionChange={handlePlayerSelectionChange}
            />
          )}
        </div>)}
        {teamState.players && teamState.players?.length > 0 && !update && toBeCaptains}
      </>)}

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
