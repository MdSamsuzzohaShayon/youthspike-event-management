import { UPDATE_EVENT_RAW } from '@/graphql/event';
import { IError, IEventAdd, IEventSponsorAdd, IProStats, IProStatsAdd } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { handleResponseCheck } from './playerHelpers';

interface IUpdateEventVariables {
  eventId: string;
  updateInput: Partial<IEventAdd>;
  sponsorsInput: IEventSponsorAdd[];
  sponsorsStringInput: IEventSponsorAdd[];
  logo: string | null;
  multiplayerInput: Partial<IProStatsAdd>;
  weightInput: Partial<IProStatsAdd>;
  statsInput: Partial<IProStatsAdd>;
}

function createFileMap(sponsorFileList: IEventSponsorAdd[], hasEventLogo: boolean) {
  const mapObj: Record<string, string[]> = {};

  sponsorFileList.forEach((_, index) => {
    mapObj[index.toString()] = [`variables.sponsorsInput.${index}.logo`];
  });

  if (hasEventLogo) {
    mapObj[sponsorFileList.length] = ['variables.logo'];
  }

  return mapObj;
}

function addFilesToFormData(formData: FormData, sponsorFileList: IEventSponsorAdd[], eventLogo: Blob | null) {
  sponsorFileList.forEach((sponsor, index) => {
    if (sponsor.logo instanceof File && sponsor.company) {
      formData.set(`${index}`, sponsor.logo);
    }
  });

  if (eventLogo) {
    formData.set(`${sponsorFileList.length}`, eventLogo);
  }
}

// Update your processSponsorsForUpdate function to ensure it returns the correct structure
function processSponsorsForUpdate(sponsorImgList: IEventSponsorAdd[]) {
  const sponsorFileList: IEventSponsorAdd[] = [];
  const sponsorsInput: IEventSponsorAdd[] = [];
  const sponsorsStringInput: IEventSponsorAdd[] = [];

  
  sponsorImgList.forEach((sponsor) => {
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
      sponsorsInput.push({ company: cleanSponsor.company, logo: null });
    }
  });

  return { sponsorsInput, sponsorFileList, sponsorsStringInput };
}


export async function updateEventWithFiles({
  eventId,
  updateEvent,
  sponsorImgList,
  eventLogo,
  updateMultiplayer,
  updateStats,
  updateWeight,
  setActErr,
}: {
  eventId: string;
  updateEvent: Partial<IEventAdd>;
  sponsorImgList: IEventSponsorAdd[];
  eventLogo: Blob | null;
  updateMultiplayer: Partial<IProStatsAdd>;
  updateWeight: Partial<IProStatsAdd>;
  updateStats: Partial<IProStatsAdd>;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}) {
  const inputData = { ...updateEvent };
  if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString();
  if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString();

  const { sponsorsInput, sponsorFileList, sponsorsStringInput } = processSponsorsForUpdate(sponsorImgList);

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
  return handleResponseCheck(eventRes, setActErr );
}
