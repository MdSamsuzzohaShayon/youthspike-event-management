import { UPDATE_EVENT_RAW } from '@/graphql/event';
import { ICreateEventResponse, IEventAdd, IEventSponsor, IMessage, IProStats, IProStatsAdd, IResponse, TAddBadge } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { handleResponseCheck } from './playerHelpers';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';
import { handleApiResult } from '../handleError';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';
import routerService from '@/lib/router-service';

interface IUpdateEventVariables {
  eventId: string;
  updateInput: Partial<IEventAdd>;
  sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[];
  sponsorsStringInput: Omit<IEventSponsor, '_id' | 'event'>[];
  logo: string | null;
  multiplayerInput: Partial<IProStatsAdd>;
  weightInput: Partial<IProStatsAdd>;
  statsInput: Partial<IProStatsAdd>;
}

function createFileMap(sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[], hasEventLogo: boolean) {
  const mapObj: Record<string, string[]> = {};

  for (let i = 0; i < sponsorFileList.length; i++) {
    mapObj[String(i)] = [`variables.sponsorsInput.${i}.logo`];
  }

  if (hasEventLogo) {
    mapObj[sponsorFileList.length] = ['variables.logo'];
  }

  return mapObj;
}

function addFilesToFormData(formData: FormData, sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[], eventLogo: Blob | null) {

  for (let i = 0; i < sponsorFileList.length; i++) {
    const sponsor = sponsorFileList[i];
    if (sponsor.logo instanceof File && sponsor.company) {
      formData.set(`${i}`, sponsor.logo);
    }
  }
  if (eventLogo) {
    formData.set(`${sponsorFileList.length}`, eventLogo);
  }
}

interface IProcessedSponsors {
  sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[];
  sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[];
  sponsorsStringInput: Omit<IEventSponsor, '_id' | 'event'>[];
}

// Update your processSponsorsForUpdate function to ensure it returns the correct structure
function processSponsorsForUpdate(sponsorImgList: Omit<IEventSponsor, '_id' | 'event'>[]): IProcessedSponsors {
  const sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[] = [];
  const sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[] = [];
  const sponsorsStringInput: Omit<IEventSponsor, '_id' | 'event'>[] = [];


  for (const sponsor of sponsorImgList) {
    // Ensure company is always just a string
    const cleanSponsor = {
      // @ts-ignore
      company: typeof sponsor.company === 'string' ? sponsor.company : sponsor.company?.company || '',
      logo: sponsor.logo,
    };

    if (typeof sponsor.logo === 'string') {
      sponsorsStringInput.push(cleanSponsor);
    } else if (cleanSponsor.company !== APP_NAME) {
      sponsorFileList.push(cleanSponsor);
      // @ts-ignore
      sponsorsInput.push({ company: cleanSponsor.company, logo: null });
    }
  }


  return { sponsorsInput, sponsorFileList, sponsorsStringInput };
}

type TMutationFunction = useMutation.MutationFunction<
  { updateEvent: IResponse },
  {
    [x: string]: any;
  },
  ApolloCache
>;

interface IUpdateEventParams {
  eventId: string;
  mutateEvent: TMutationFunction,
  updateEventState: Partial<IEventAdd>;
  sponsors: Omit<IEventSponsor, '_id' | 'event'>[];
  badges: TAddBadge[];
  eventLogo: Blob | null;
  updateMultiplayer: Partial<IProStatsAdd>;
  updateWeight: Partial<IProStatsAdd>;
  updateStats: Partial<IProStatsAdd>;
  setMessage: (message: Omit<IMessage, "id">) => void
}


export async function updateEvent({
  eventId,
  mutateEvent, // GraphQL Query
  updateEventState,
  sponsors,
  badges,
  eventLogo,
  updateMultiplayer,
  updateStats,
  updateWeight,
  setMessage,
}: IUpdateEventParams): Promise<IResponse> {
  try {
    const updateInput = { ...updateEventState, badges: (badges || []).map((badge)=> ({name: badge.name, icon: badge.icon, description: badge.description})) };
    if (updateInput.startDate) updateInput.startDate = new Date(updateInput.startDate).toISOString();
    if (updateInput.endDate) updateInput.endDate = new Date(updateInput.endDate).toISOString();
    if (updateInput.divisions) delete updateInput.divisions;

    const { sponsorsInput, sponsorFileList, sponsorsStringInput } = processSponsorsForUpdate(sponsors);

    let responseData: IResponse | undefined;
    const variables: IUpdateEventVariables = {
      eventId,
      updateInput,
      sponsorsInput,
      sponsorsStringInput,
      multiplayerInput: updateMultiplayer,
      weightInput: updateWeight,
      statsInput: updateStats,
      logo: null,
    };

    if (sponsors.length > 0 || eventLogo) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: UPDATE_EVENT_RAW,
          variables,
        }),
      );

      const mapObj = createFileMap(sponsorFileList, !!eventLogo);
      formData.set('map', JSON.stringify(mapObj));
      addFilesToFormData(formData, sponsorFileList, eventLogo);

      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'apollo-require-preflight': 'true',
        },
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

      responseData = json.data?.createEvent;
    } else {
      const result = await mutateEvent({ variables });
      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.updateEvent;
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


    return responseData;

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
  }




}
