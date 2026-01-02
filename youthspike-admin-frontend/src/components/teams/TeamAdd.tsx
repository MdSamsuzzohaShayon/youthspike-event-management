import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IOption, IPlayer, ITeamAdd, IGroup, IUpdateTeamRes, ITeamRes, ITeam } from '@/types';
import { ADD_A_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import SelectInput from '../elements/forms/SelectInput';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import { useLdoId } from '@/lib/LdoProvider';
import Link from 'next/link';
import { useError } from '@/lib/ErrorProvider';
import InputField from '../elements/forms/InputField';
import ImageInput from '../elements/forms/ImageInput';
import { divisionsToOptionList } from '@/utils/helper';
import updateTeam from '@/utils/requestHandlers/updateTeam';
import createTeam from '@/utils/requestHandlers/createTeam';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';



interface ITeamAddProps {
  eventId: string;
  players: IPlayer[];
  groupList: IGroup[];
  handleClose: (e: React.SyntheticEvent) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisions?: string;
  currDivision?: string;
  update?: boolean;
  prevTeam?: ITeam;
}

const initialTeamState = {
  active: true,
  name: '',
  logo: null,
  event: '',
  division: '',
  players: [],
  captain: '',
};

function TeamAdd({ eventId, groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, divisions }: ITeamAddProps) {
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();
  const router = useRouter();

  // Helper function to transform ITeam to ITeamAdd format
  const transformTeamToTeamAdd = (team: ITeam): ITeamAdd => ({
    active: team.active,
    name: team.name,
    logo: team.logo ?? null,
    event: eventId,
    division: team.division,
    players: [],
    captain: team?.captain?._id || null,
  });

  const [teamState, setTeamState] = useState<ITeamAdd>(
    prevTeam ? transformTeamToTeamAdd(prevTeam) : initialTeamState
  );
  const [updateTeamState, setUpdateTeamState] = useState<Partial<ITeamAdd>>({});
  const [playerIdList, setPlayerIdList] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);

  const uploadedLogo = useRef<null | MediaSource | Blob>(null);

  // GraphQL
  const [addTeam, { data, loading, error }] = useMutation<{createTeam: ITeamRes}>(ADD_A_TEAM);
  const [mutateTeam, { data: mData, loading: mLoading, error: mError }] = useMutation<{updateTeam: IUpdateTeamRes}>(UPDATE_TEAM);

  const refetch = (url?: string) => {
    // if (url) {
    //   router.push(url);
    // } else {
    //   router.push(`/${eventId}/teams/${ldoIdUrl}`);
    // }
  };

  // Handle events
  const handleTeamAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    let success = null;
    if (update) {
      success = await updateTeam({
        eventId,
        prevTeam: prevTeam ? { ...transformTeamToTeamAdd(prevTeam), _id: prevTeam._id } : null,
        updateTeamState,
        setActErr,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        mutateTeam,
        addTeam,
        setAvailablePlayers,
        setPlayerIdList,
      });
      if (success) {
        const formEl = e.target as HTMLFormElement;
        formEl.reset();
        handleClose(e);
        // refetch();
        // router.push(`/${eventId}/teams/${ldoIdUrl}`);
        window.location.reload();
      }
    } else {
      success = await createTeam({
        eventId,
        teamState,
        currDivision: currDivision || null,
        setActErr,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        addTeam,
        mutateTeam,
        setAvailablePlayers,
        setPlayerIdList,
      });
      if(success){
        router.push(`/${eventId}/teams/${ldoIdUrl}`);
      }
    }

    
  };

  const handleSaveAndCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    let success = null;
    if (update) {
      success = await updateTeam({
        eventId,
        prevTeam: prevTeam ? { ...transformTeamToTeamAdd(prevTeam), _id: prevTeam._id } : null,
        updateTeamState,
        setActErr,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        mutateTeam,
        addTeam,
        setAvailablePlayers,
        setPlayerIdList,
      });
    } else {
      success = await createTeam({
        eventId,
        teamState,
        currDivision: currDivision || null,
        setActErr,
        setIsLoading,
        uploadedLogo,
        playerIdList,
        addTeam,
        mutateTeam,
        setAvailablePlayers,
        setPlayerIdList,
      });
    }

    window.location.reload();

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
      // @ts-ignore
      setPlayerIdList((prevState) => [...new Set([...prevState, playerId])]);
    } else {
      setPlayerIdList((prevState) => prevState.filter((p) => p !== playerId));
    }
  };

  const handleFileChange = (uploadedFile: MediaSource | Blob) => {
    uploadedLogo.current = uploadedFile;
  };
  // Renders
  const toBeCaptains = useMemo(() => {
    const playersWithEmail = availablePlayers.filter((ap) => playerIdList.includes(ap._id) && ap.email && ap.email.trim() !== '');
    const options = makeOptionList(playersWithEmail);
    return <SelectInput name="captain" optionList={options && options.length > 0 ? options : []} handleSelect={handleInputChange} />;
  }, [availablePlayers, playerIdList]);

  const divisionList = useMemo(() => {
    if (!divisions) return [];
    return divisionsToOptionList(divisions);
  }, [divisions]);

  useEffect(() => {
    setAvailablePlayers(players || []);
  }, [players]);
  
  

  return (
    <form onSubmit={handleTeamAdd} className="flex flex-col gap-2">
      <InputField type="text" name="name" required={!update} defaultValue={teamState.name} className="mt-6" handleInputChange={handleInputChange} />
      {divisionList.length > 0 && (
        <SelectInput key="d-t-d-1" defaultValue={currDivision || teamState?.division} handleSelect={handleInputChange} name="division" className="mt-6" optionList={divisionList} />
      )}

      <SelectInput
        key="g-t-d"
        required={!update}
        handleSelect={handleInputChange}
        name="group"
        className="mt-6"
        {...(prevTeam?.group ? { defaultValue: prevTeam?.group?._id || String(prevTeam?.group) } : {})}
        optionList={
          teamState.division && teamState.division !== ''
            ? groupList.filter((g) => g.division.trim().toUpperCase() === teamState.division.trim().toUpperCase()).map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
            : groupList.map((g, gI) => ({ id: gI + 1, text: g.name, value: g._id }))
        }
      />
      <Link className="underline underline-offset-1" href={`/${eventId}/groups/new/${ldoIdUrl}`}>
        Create new group!
      </Link>

      <div className="w-full md:w-2/6">
        <ImageInput name="logo" defaultValue={teamState.logo} handleFileChange={handleFileChange} />
      </div>

      {!update && (
        <div className="player-input mb-4">
          <PlayerSelectInput availablePlayers={availablePlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="player-select" />
        </div>
      )}
      {playerIdList.length > 0 && !update && toBeCaptains}

      <div className="input-group w-full mb-4">
        <button className="btn-info mr-2" type="submit">
          {update ? 'Update' : 'Save'}
        </button>
        {!update && (
          <button className="btn-info" type="button" onClick={handleSaveAndCreate}>
            Save & Create Another
          </button>
        )}
      </div>
    </form>
  );
}

export default TeamAdd;
