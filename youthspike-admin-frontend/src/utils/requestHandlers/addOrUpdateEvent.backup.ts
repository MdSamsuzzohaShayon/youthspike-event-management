import { ADD_EVENT_RAW, UPDATE_EVENT_RAW } from '@/graphql/event';
import { IError, IEventAdd, IEventSponsorAdd } from '@/types';
import React from 'react';
import { APP_NAME, BACKEND_URL } from '../keys';
import { MutationFunction } from '@apollo/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Socket } from 'socket.io-client';
import { ERosterLock } from '@/types/event';
import { getCookie } from '../clientCookie';
import { handleResponse } from '../handleError';
import { IProStatsAdd } from '@/types/playerStats';

interface IAddOrUpdateProps {
  e: React.SyntheticEvent;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  update: boolean;
  eventId: string | null;
  directorId: string | null;
  setEventState: React.Dispatch<React.SetStateAction<IEventAdd>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  eventState: IEventAdd;
  updateEvent: Partial<IEventAdd>;
  sponsorImgList: IEventSponsorAdd[];
  eventLogo: React.RefObject<null | MediaSource | Blob>;
  eventUpdate: MutationFunction;
  eventAdd: MutationFunction;
  router: AppRouterInstance;
  initialEvent: IEventAdd;
  socket: Socket | null;
  ldoIdUrl: string;
  multiplayer: IProStatsAdd;
  weight: IProStatsAdd;
  stats: IProStatsAdd;
}

interface IMutationVariables {
  sponsorsInput: IEventSponsorAdd[];
  logo: null | string;
  updateInput: Partial<IEventAdd>;
  input: Partial<IEventAdd>;
  eventId: string;
  sponsorsStringInput: IEventSponsorAdd[];
  multiplayerInput: IProStatsAdd;
  weightInput: IProStatsAdd;
  statsInput: IProStatsAdd;
}

/**
 * Add event mutation
 */
async function addOrUpdateEvent({
  e,
  setActErr,
  update,
  eventId,
  directorId,
  setEventState,
  setIsLoading,
  eventState,
  updateEvent,
  sponsorImgList,
  eventLogo,
  eventUpdate,
  eventAdd,
  router,
  initialEvent,
  socket,
  ldoIdUrl,
  multiplayer,
  weight,
  stats,
}: IAddOrUpdateProps) {
  setIsLoading(true);
  let newEventId = null;
  const inputData = update ? { ...updateEvent } : { ...eventState };
  inputData.ldo = directorId ? directorId : 'auto_detect_from_server';
  if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString();
  if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString();

  if (eventState.rosterLock === ERosterLock.PICK_A_DATE) {
    return setActErr({ message: 'You must choose a date when ranking of the player is going to lock!', success: false });
  }

  const mutationVariables: Partial<IMutationVariables> = {
    sponsorsInput: [],
    logo: null, // This is event logo
  };
  if (update) {
    mutationVariables.updateInput = inputData;
  } else {
    mutationVariables.input = inputData;
    mutationVariables.multiplayerInput = multiplayer;
    mutationVariables.weightInput = weight;
    mutationVariables.statsInput = stats;
  }

  if (update && eventId) mutationVariables.eventId = eventId;

  try {
    let sponsorFileList: IEventSponsorAdd[] = [];
    const sponsorStringList: IEventSponsorAdd[] = [];
    sponsorImgList.forEach((sponsor) => {
      if (typeof sponsor.logo === 'string') {
        sponsorStringList.push({ company: sponsor.company, logo: sponsor.logo });
      } else {
        sponsorFileList.push(sponsor);
      }
    });

    if (sponsorFileList.length === 1 && sponsorFileList[0].company === APP_NAME) sponsorFileList = [];

    if (update && sponsorStringList.length > 0) mutationVariables.sponsorsStringInput = sponsorStringList;

    if (sponsorFileList.length > 0 || eventLogo.current) {
      // Use FormData with fetch if there is a file to upload on the server
      const formData = new FormData();

      const sponsorsInputList = [];
      for (let i = 0; i < sponsorFileList.length; i += 1) {
        sponsorsInputList.push({ company: sponsorFileList[i].company, logo: null });
      }

      mutationVariables.sponsorsInput = sponsorsInputList;

      formData.set(
        'operations',
        JSON.stringify({
          query: update ? UPDATE_EVENT_RAW : ADD_EVENT_RAW,
          variables: mutationVariables,
        }),
      );

      // Sponsors
      const mapObj: Record<string, any> = {};
      for (let i = 0; i < sponsorFileList.length; i += 1) {
        mapObj[i.toString()] = [`variables.sponsorsInput.${i}.logo`];
      }

      // formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      // formData.set('0', uploadedLogo.current);

      if (eventLogo && eventLogo.current instanceof Blob) {
        mapObj[sponsorFileList.length] = [`variables.logo`];
      }
      formData.set('map', JSON.stringify(mapObj));
      for (let i = 0; i < sponsorFileList.length; i += 1) {
        if (sponsorFileList[i].logo && sponsorFileList[i].logo instanceof File && sponsorFileList[i].company && sponsorFileList[i].company !== '') {
          const uploadedFile = sponsorFileList[i].logo as File;
          formData.set(`${i}`, uploadedFile);
        }
      }

      // Add the event logo to formData
      if (eventLogo && eventLogo.current instanceof Blob) {
        formData.set(`${sponsorFileList.length}`, eventLogo.current);
      }

      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      const eventRes = update ? responseData?.data?.updateEvent : responseData?.data?.createEvent;

      const success = await handleResponse({ response: eventRes, setActErr });
      if (success) {
        newEventId = eventRes?.data?._id;
      }
    } else {
      // Use Apollo Client mutation
      if (!mutationVariables.sponsorsInput) mutationVariables.sponsorsInput = [];
      let eventRes = null;
      const mutationInput = { ...mutationVariables.input };
      if (mutationInput.logo) delete mutationInput.logo;
      mutationVariables.input = mutationInput;
      if (update) {
        eventRes = await eventUpdate({ variables: mutationVariables });
      } else {
        eventRes = await eventAdd({ variables: mutationVariables });
      }
      // Define the variables you want to use
      // const variables = { eventId: params.eventId };

      eventRes = update ? eventRes.data?.updateEvent : eventRes.data?.createEvent;
      const success = await handleResponse({ response: eventRes, setActErr });
      if (success) {
        newEventId = eventRes?.data?._id;
      }
    }

    // Reset form and navigate
    setEventState(initialEvent);
    const formEl = e.target as HTMLFormElement;
    formEl.reset();

    if (newEventId) {
      router.push(`/${newEventId}/${ldoIdUrl}`);
    }
  } catch (error) {
    setActErr({ message: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error), success: false });
  } finally {
    setIsLoading(false);
  }
}

export default addOrUpdateEvent;
