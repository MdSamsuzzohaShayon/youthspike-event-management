import { CREATE_PLAYER_RAW, PLAYER_FRAGMENT } from '@/graphql/players';
import { sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IGetPlayerResponse, IGetPlayersResponse, IMessage, IResponse, TAddPlayer } from '@/types';
import { useMutation } from '@apollo/client/react';
import { ApolloCache, ApolloClient } from '@apollo/client';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';
import routerService from '@/lib/router-service';
import { handleApiResult } from '../handleError';
import { getCookie } from '../clientCookie';
import { BACKEND_URL } from '../keys';

type IAddPlayer = useMutation.MutationFunction<{
  createPlayer: IGetPlayerResponse;
}, {
  [x: string]: any;
}, ApolloCache>;

interface ICreatePlayer {
  setMessage: (message: Omit<IMessage, "id">) => void;
  apolloClient: ApolloClient;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerState: TAddPlayer;
  uploadedProfile: React.RefObject<File | null>;
  addPlayer: IAddPlayer;
}

async function createPlayer({
  setMessage,
  apolloClient,
  setIsLoading,
  playerState,
  uploadedProfile,
  addPlayer,
}: ICreatePlayer) {
  try {
    setIsLoading(true);

    if (!playerState.division) {
      setMessage({ type: 'error', message: 'You must select a division!' });
      return;
    }

    let responseData: IGetPlayerResponse | undefined;
    if (uploadedProfile?.current instanceof Blob) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({ query: CREATE_PLAYER_RAW, variables: { input: playerState, profile: null } })
      );
      formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
      formData.set('0', uploadedProfile.current);

      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}`, 'apollo-require-preflight': 'true', },
      });


      // 🔴 Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      // 🔴 Handle GraphQL errors
      if (json.errors?.length) {
        throw new Error(json.errors[0].message || 'GraphQL Error');
      }

      responseData = json.data?.createPlayer;

    } else {


      const result = await addPlayer({ variables: { input: playerState } });
      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.createPlayer;
    }


    // 🔴 No response safety
    if (!responseData) {
      throw new Error('No response received from server');
    }

    // ✅ Success handling
    const result = handleApiResult({ response: responseData });

    if (result?.code > 299) {
      throw new Error(result.message);
    }

    setMessage({
      type: 'success',
      message: result?.message || 'Player created successfully',
    });


    if (responseData?.data) {
      const newPlayer = responseData.data;
    
      apolloClient.cache.modify({
        fields: {
          getPlayers(existing, { readField }) {
            if (!existing) return existing;
    
            const existingData =
              readField<{ __ref: string }[]>('data', existing) ?? [];
    
            const alreadyExists = existingData.some(
              (ref) => readField('_id', ref) === newPlayer._id,
            );
    
            if (alreadyExists) {
              return existing;
            }
    
            const newRef = apolloClient.cache.writeFragment({
              fragment: PLAYER_FRAGMENT,
              data: {
                __typename: 'Player',
                ...newPlayer,
              },
            });
    
            return {
              ...existing,
              data: [newRef, ...existingData],
            };
          },
        },
      });
    }

  } catch (error) {
    console.error(error);

    // 🧠 Smart error extraction
    let message = 'Something went wrong';

    if (error instanceof Error) {
      message = error.message;
    }

    setMessage({
      type: 'error',
      message,
    });


    SessionStorageService.removeItem(DIVISION);
    removeTeamFromStore();
    await fetch('/api/logout', { method: 'GET' });
    routerService.push('/login');


    throw new Error(message);
  } finally {
    setIsLoading(false);
  }
  return false;
}

export default createPlayer;
