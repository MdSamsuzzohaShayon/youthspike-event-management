import { UPDATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleRedirect, sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IMessage, IResponse } from '@/types';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';
import { handleApiResult } from '../handleError';
import { getCookie } from '../clientCookie';
import { BACKEND_URL } from '../keys';
import routerService from '@/lib/router-service';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';

interface IUpdatePlayerData extends IResponse {
  data?: IPlayerExpRel;
}


type TMutationFunction = useMutation.MutationFunction<
  {
    updatePlayer: IUpdatePlayerData;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

interface IUpdatePlayer {
  setMessage: (message: Omit<IMessage, "id">) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerUpdate: Partial<IPlayerAdd>;
  prevPlayer: IPlayer | null;
  uploadedProfile: React.RefObject<File | null>;
  updatePlayer: TMutationFunction;

}

async function updatePlayerFn({
  setMessage,
  setIsLoading,
  playerUpdate,
  prevPlayer,
  uploadedProfile,
  updatePlayer,
}: IUpdatePlayer) {
  setIsLoading(true);

  try {
    let responseData: IUpdatePlayerData | undefined;

    // 🟡 CASE 1: File upload (fetch)
    if (uploadedProfile?.current) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: UPDATE_PLAYER_RAW,
          variables: {
            input: playerUpdate,
            profile: null,
            playerId: prevPlayer?._id,
          },
        }),
      );
      formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
      formData.set('0', uploadedProfile.current);

      const token = getCookie('token');

      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'apollo-require-preflight': 'true',
        },
      });

      // 🔴 Handle HTTP errors
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();

      // 🔴 Handle GraphQL errors
      if (json.errors?.length) {
        throw new Error(json.errors[0].message || 'GraphQL Error');
      }

      responseData = json.data?.updatePlayer;
    }

    // 🟢 CASE 2: Apollo mutation
    else {
      const result = await updatePlayer({
        variables: {
          input: playerUpdate,
          playerId: prevPlayer?._id,
        },
      });

      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.updatePlayer;
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
      message: result?.message || 'Player updated successfully',
    });

    return result;

  } catch (error: unknown) {
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
}


export default updatePlayerFn;