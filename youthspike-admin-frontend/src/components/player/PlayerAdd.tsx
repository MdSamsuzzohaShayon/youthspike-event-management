'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { IPlayer } from '@/types/player';
import SelectInput from '../elements/forms/SelectInput';
import {
  IBadge,
  IEvent,
  IGetPlayerResponse,
  ITeamRelatives,
  IUpdatePlayerResponse,
  TAddPlayer,
  TUpdatePlayer,
  UserRole,
} from '@/types';
import { CREATE_PLAYER, UPDATE_PLAYER } from '@/graphql/players';
import { useRouter } from 'next/navigation';
import SessionStorageService from '@/utils/SessionStorageService';
import ImageInput from '../elements/forms/ImageInput';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import InputField from '../elements/forms/InputField';
import Loader from '../elements/Loader';
import updatePlayer from '@/utils/request-handlers/updatePlayer';
import createPlayer from '@/utils/request-handlers/createPlayer';
import { CURRENT_EVENT, DIVISION, TEAM } from '@/utils/constant';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';
import validatePassword from '@/utils/validatePassword';
import { useUser } from '@/lib/UserProvider';
import { buildBadgeOptions, buildDivisionOptions, buildTeamOptions, canUpdatePassword, getFieldNameAndValue, toSingleValueArray } from '@/utils/player/add-player';
import PlayerDetailsFields from './PlayerDetailsField';
import EventAndDivisionSelectors from './EventAndDivisionSelectors';
import { CldImage } from 'next-cloudinary';
import BadgeSelect from '../elements/forms/BadgeSelect';

interface IPlayerAddProps {
  teams: ITeamRelatives[];
  events?: IEvent[];
  badges?: IBadge[];
  prevPlayer?: IPlayer | null;
  update?: boolean;
}


/** A change event coming from either a text input or a select. */
type FormFieldChangeEvent = React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>;

const initialPlayerState: TAddPlayer = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  events: [],
  teams: [],
  phone: '',
  division: ''
};



// ---------------------------------------------------------------------------
// PlayerAdd — top-level component: owns state, wires everything together.
// ---------------------------------------------------------------------------

function PlayerAdd({ update, prevPlayer, teams, events, badges }: IPlayerAddProps) {
  const isUpdateMode = Boolean(update);
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();
  const apolloClient = useApolloClient();
  const user = useUser();

  const [playerState, setPlayerState] = useState<TAddPlayer>(initialPlayerState);
  const [playerUpdate, setPlayerUpdate] = useState<Partial<TUpdatePlayer>>({});
  const uploadedProfile = useRef<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addPlayer] = useMutation<{ createPlayer: IGetPlayerResponse }>(CREATE_PLAYER);
  const [mutatePlayer] = useMutation<{ updatePlayer: IUpdatePlayerResponse }>(UPDATE_PLAYER);

  // -------------------- Memoized Values --------------------
  const divisionOptions = useMemo(
    () => buildDivisionOptions(events, playerState.events),
    [events, playerState.events]
  );

  const teamOptions = useMemo(
    () => buildTeamOptions(teams, playerState.events),
    [teams, playerState.events]
  );

  const allowUpdatePassword = useMemo(
    () => canUpdatePassword(isUpdateMode, prevPlayer, user.info?.role),
    [isUpdateMode, prevPlayer, user.info?.role]
  );

  // -------------------- Field update helpers --------------------

  /** Applies a patch to `playerState`, and to `playerUpdate` when editing. */
  const applyFieldChange = useCallback(
    (patch: Partial<TAddPlayer> & Partial<TUpdatePlayer>) => {
      setPlayerState((prev) => ({ ...prev, ...patch } as TAddPlayer));
      if (isUpdateMode) {
        setPlayerUpdate((prev) => ({ ...prev, ...patch }));
      }
    },
    [isUpdateMode]
  );

  const handleInputChange = useCallback(
    (e: React.SyntheticEvent) => {
      const { fieldName, fieldValue } = getFieldNameAndValue(e);
      applyFieldChange({ [fieldName]: fieldValue } as Partial<TAddPlayer> & Partial<TUpdatePlayer>);
    },
    [applyFieldChange]
  );

  // FormFieldChangeEvent
  const handleDivisionChange = useCallback(
    (e: React.SyntheticEvent) => {
      const { fieldValue } = getFieldNameAndValue(e);
      const division = fieldValue.trim();
      if (division) {
        SessionStorageService.setItem(DIVISION, division);
      } else {
        SessionStorageService.removeItem(DIVISION);
      }
      // Bug fix: previously this returned early on an empty division and
      // never cleared `playerState.division`, so the field couldn't be reset.
      applyFieldChange({ division });
    },
    [applyFieldChange]
  );

  const handleEventChange = useCallback(
    (e: React.SyntheticEvent) => {
      const { fieldValue } = getFieldNameAndValue(e);
      applyFieldChange({ events: [fieldValue] });
    },
    [applyFieldChange]
  );

  const handleTeamChange = useCallback(
    (e: React.SyntheticEvent) => {
      const { fieldValue } = getFieldNameAndValue(e);
      applyFieldChange({ teams: toSingleValueArray(fieldValue) });
    },
    [applyFieldChange]
  );

  const handleFileChange = useCallback((uploadedFile: Blob | MediaSource) => {
    if (uploadedFile instanceof File) {
      uploadedProfile.current = uploadedFile;
    } else {
      console.warn('ImageInput returned an unexpected file type; ignoring upload.');
      uploadedProfile.current = null;
    }
  }, []);

  // Make selecting badge better 

  // -------------------- Submit --------------------

  const redirectAfterSave = useCallback(() => {
    const [selectedTeamId] = playerState.teams ?? [];
    if (selectedTeamId) {
      router.push(`/teams/${selectedTeamId}/roster/${ldoIdUrl}`);
      return;
    }
    const currentEventId = SessionStorageService.getItem(CURRENT_EVENT);
    router.push(currentEventId ? `/${currentEventId}/players/${ldoIdUrl}` : `/players/${ldoIdUrl}`);
  }, [playerState.teams, router, ldoIdUrl]);

  const handleAddPlayer = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        if (isUpdateMode) {
          const hasNothingToUpdate = Object.keys(playerUpdate).length === 0 && !uploadedProfile.current;
          if (hasNothingToUpdate) {
            setMessage({ type: 'warning', code: 200, message: 'Nothing to update!' });
            return;
          }
          if (playerUpdate.password) {
            const validationError = validatePassword(playerUpdate.password, playerUpdate.confirmPassword);
            if (validationError) {
              setMessage({ type: 'error', code: 406, message: validationError });
              return;
            }
          }
          await updatePlayer({
            setMessage,
            setIsLoading,
            playerUpdate,
            prevPlayer: prevPlayer || null,
            uploadedProfile,
            mutatePlayer,
          });
        } else {
          await createPlayer({ setMessage, apolloClient, setIsLoading, playerState, uploadedProfile, addPlayer });
        }
        // Bug fix: the save call was previously fired without `await`, so
        // navigation happened immediately regardless of whether it succeeded.
        redirectAfterSave();
      } catch (error) {
        console.error('Failed to save player:', error);
        setMessage({
          type: 'error',
          code: 500,
          message: 'Something went wrong while saving the player. Please try again.',
        });
      }
    },
    [
      isUpdateMode,
      playerUpdate,
      playerState,
      prevPlayer,
      mutatePlayer,
      addPlayer,
      apolloClient,
      setMessage,
      redirectAfterSave,
    ]
  );

  // Set initial previous player object for updating
  useEffect(() => {
    if (isUpdateMode && prevPlayer) {
      setPlayerState(prevPlayer);
    }
  }, [isUpdateMode, prevPlayer]);

  // Apply create-mode defaults from session storage.
  useEffect(() => {
    if (isUpdateMode) return;
    try {
      const sessionDivision = SessionStorageService.getItem(DIVISION);
      const sessionEventId = SessionStorageService.getItem(CURRENT_EVENT);
      const sessionTeamId = SessionStorageService.getItem(TEAM);

      const defaultsFromSession: Partial<TAddPlayer> = {};
      if (sessionDivision) defaultsFromSession.division = sessionDivision as string;
      if (sessionEventId) defaultsFromSession.events = [sessionEventId as string];
      if (sessionTeamId) defaultsFromSession.teams = [sessionTeamId as string];


      setPlayerState((prev) => ({ ...prev, ...defaultsFromSession }));
    } catch (error) {
      console.error('Failed to read player defaults from session storage:', error);
    }
    // Bug fix: `teams` was listed as a dependency but never read in this
    // effect, so an unrelated change to the `teams` prop could re-run this
    // and silently overwrite the user's in-progress event/division/team
    // selection with stale session-storage values.
  }, [isUpdateMode]);



  if (isLoading) return <Loader />;

  return (
    <form onSubmit={handleAddPlayer} className="w-full">
      <ImageInput
        onFileChange={handleFileChange}
        name="profile"
        defaultValue={prevPlayer?.profile || null}
        className="mt-6 w-full md:w-2/6"
      />
      {!isUpdateMode && (
        <EventAndDivisionSelectors
          events={events}
          selectedEventId={playerState.events && playerState.events.length > 0 ? playerState.events[0] : null}
          divisionOptions={divisionOptions}
          selectedDivision={playerState.division}
          onEventChange={handleEventChange}
          onDivisionChange={handleDivisionChange}
        />
      )}
      <PlayerDetailsFields
        isUpdateMode={isUpdateMode}
        playerState={playerState}
        playerUpdate={playerUpdate}
        canEditPassword={allowUpdatePassword}
        onFieldChange={handleInputChange}
      />
      {teamOptions.length > 0 && (
        <SelectInput
          name="teams"
          className="mt-6"
          value={playerState.teams && playerState.teams.length > 0 ? (playerState.teams[0] as string) : null}
          optionList={teamOptions}
          handleSelect={handleTeamChange}
        />
      )}

      <BadgeSelect
        name="badge"
        className='mt-6'
        value={playerState.badge as string}
        badges={badges || []}
        onChange={handleInputChange}

      />

      <div className="input-group w-full mb-4">
        <button type="submit" className="btn-info mt-8 w-full">
          {isUpdateMode ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default PlayerAdd;