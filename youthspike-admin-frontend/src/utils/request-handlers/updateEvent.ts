import { UPDATE_EVENT_RAW } from '@/graphql/event';
import { IEventAdd, IEventSponsor, IMessage, IProStats, IProStatsAdd } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { handleResponseCheck } from './playerHelpers';

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


export async function updateEventWithFiles({
  eventId,
  updateEvent,
  sponsors,
  eventLogo,
  updateMultiplayer,
  updateStats,
  updateWeight,
  setMessage,
}: {
  eventId: string;
  updateEvent: Partial<IEventAdd>;
  sponsors: Omit<IEventSponsor, '_id' | 'event'>[];
  eventLogo: Blob | null;
  updateMultiplayer: Partial<IProStatsAdd>;
  updateWeight: Partial<IProStatsAdd>;
  updateStats: Partial<IProStatsAdd>;
  setMessage?: (message: Omit<IMessage, "id">) => void
}) {
  const inputData = { ...updateEvent };
  if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString();
  if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString();

  const { sponsorsInput, sponsorFileList, sponsorsStringInput } = processSponsorsForUpdate(sponsors);

  const formData = new FormData();
  const variables: IUpdateEventVariables = {
    eventId,
    updateInput: inputData,
    sponsorsInput,
    sponsorsStringInput,
    multiplayerInput: updateMultiplayer,
    weightInput: updateWeight,
    statsInput: updateStats,
    logo: null,
  };

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


  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const responseData = await response.json();
  const eventRes = responseData?.data?.updateEvent;
  return handleResponseCheck(eventRes, setMessage);
}
