// ------------------------------
// ♻️ Update Team
// ------------------------------

import { IGetTeamResponse, IMessage, ITeam, TAddTeam, TUpdateTeamFunction } from '@/types';
import routerService from '@/lib/router-service';
import { getCookie } from '../clientCookie';
import { BACKEND_URL } from '../keys';
import { TEAM_FRAGMENT, UPDATE_TEAM_RAW } from '@/graphql/teams';
import { handleApiResult } from '../handleError';
import { ApolloClient } from '@apollo/client';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';


interface IUpdateTeam {
  events: string[];
  prevTeam: ITeam | null;
  updateTeamState: Partial<TAddTeam>;
  apolloClient: ApolloClient;
  setMessage: (message: Omit<IMessage, "id">) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogo: React.RefObject<null | Blob | MediaSource>;
  // playerIdList: string[];
  mutateTeam: TUpdateTeamFunction;
}

export async function updateTeam({
  setMessage,
  events,
  prevTeam,
  updateTeamState,
  apolloClient,
  setIsLoading,
  uploadedLogo,
  // playerIdList,
  mutateTeam,
}: IUpdateTeam) {
  try {
    setIsLoading(true);

    // Build update input
    const input = { ...updateTeamState };
    if (!input.captain) delete input.captain;
    delete input.logo;

    // Ensure prevTeam is available before proceeding
    if (!prevTeam) {
      console.error("No previous team found!");
      
      return false;
    }

    const teamObj = { input, teamId: prevTeam._id, events, logo: null };
    let responseData: IGetTeamResponse | undefined;

    // 🧠 Upload with logo (if any)
    if (uploadedLogo.current instanceof Blob) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: UPDATE_TEAM_RAW,
          variables: teamObj,
        }),
      );
      formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      formData.set('0', uploadedLogo.current);

      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}`, 'apollo-require-preflight': 'true' },
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

      responseData = json.data?.updateTeam;
    } else {
      const result = await mutateTeam({ variables: teamObj });
      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.updateTeam;
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


    // Update cache
    if (responseData.data) {
      const updatedTeam = responseData.data;

      /**
       * Why writeFragment?
       *
       * - Updates normalized cache
       * - Updates every query automatically
       * - Prevents stale UI
       * - Cleaner than manual array mapping
       */

      apolloClient.cache.writeFragment({
        id: apolloClient.cache.identify({
          __typename: 'Team',
          _id: updatedTeam._id,
        }),

        fragment: TEAM_FRAGMENT,

        data: {
          __typename: 'Team',
          ...updatedTeam,
        },
      });
    }
  } catch (error: any) {
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


// Cache

export default updateTeam;