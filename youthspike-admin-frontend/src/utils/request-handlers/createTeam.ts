// ------------------------------
// 🆕 Create Team
// ------------------------------

import { IGetTeamResponse, IMessage, ITeamAdd, TCreateTeamMutationFunction } from '@/types';
import { handleApiResult } from '../handleError';
import { ADD_TEAM_RAW, TEAM_FRAGMENT } from '@/graphql/teams';
import { getCookie } from '../clientCookie';
import { BACKEND_URL } from '../keys';
import { ApolloClient } from '@apollo/client';
import routerService from '@/lib/router-service';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';

interface ICreateTeamProps {
  events: string[];
  teamState: ITeamAdd;
  apolloClient: ApolloClient;
  setMessage: (message: Omit<IMessage, "id">) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogo: React.RefObject<null | Blob | MediaSource>;
  playerIdList: string[];
  addTeam: TCreateTeamMutationFunction;
}

export async function createTeam({
  events,
  teamState,
  apolloClient,
  setMessage,
  setIsLoading,
  uploadedLogo,
  playerIdList,
  addTeam,
}: ICreateTeamProps) {
  try {
    setIsLoading(true);

    // Build input
    const input: Partial<ITeamAdd> = {
      ...teamState,
      players: playerIdList,
    };
    if (events) {
      input.events = events;
    }

    if (!input.captain) delete input.captain;
    delete input.logo;

    const teamObj = { input, logo: null };
    let responseData: IGetTeamResponse | undefined;

    // 🧠 Upload with logo (if any)
    // response = await uploadTeamData(false, teamObj, uploadedLogo);
    if (uploadedLogo.current instanceof Blob) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: ADD_TEAM_RAW,
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

      responseData = json.data?.createTeam;
    } else {
      const result = await addTeam({ variables: teamObj });
      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.createTeam;
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


    // Cache data
    if (responseData?.data) {

      const newTeam = responseData.data;

      apolloClient.cache.modify({
        fields: {
          getTeams(existing, { readField }) {
            if (!existing) return existing;

            const existingData = readField<{ __ref: string }[]>("data", existing) ?? [];

            // Prevent duplicates
            const alreadyExists = existingData.some(
              (ref) => readField("_id", ref) === newTeam._id,
            );

            if (alreadyExists) return existing;

            const newRef = apolloClient.cache.writeFragment({
              fragment: TEAM_FRAGMENT,
              data: {
                __typename: "Team",
                ...newTeam,
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

export default createTeam;
