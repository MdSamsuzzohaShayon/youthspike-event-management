import { ADD_EVENT_RAW } from '@/graphql/event';
import { IError, IEventAdd, IEventSponsorAdd, IProStatsAdd } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { handleResponse } from '../handleError';

interface IAddEventVariables {
  input: Partial<IEventAdd>;
  sponsorsInput: IEventSponsorAdd[];
  logo: string | null;
  multiplayerInput: IProStatsAdd;
  weightInput: IProStatsAdd;
}

export async function addEventWithFiles({
  eventState,
  sponsorImgList,
  eventLogo,
  directorId,
  multiplayer,
  weight,
  setActErr,
}: {
  eventState: IEventAdd;
  sponsorImgList: IEventSponsorAdd[];
  eventLogo: Blob | null;
  directorId: string | null;
  multiplayer: IProStatsAdd;
  weight: IProStatsAdd;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
}) {
  const inputData = { ...eventState };
  inputData.ldo = directorId || 'auto_detect_from_server';
  inputData.startDate = new Date(inputData.startDate).toISOString();
  inputData.endDate = new Date(inputData.endDate).toISOString();

  const { sponsorsInput, sponsorFileList } = processSponsors(sponsorImgList);
  
  const formData = new FormData();
  const variables: IAddEventVariables = {
    input: inputData,
    sponsorsInput,
    logo: null,
    multiplayerInput: multiplayer,
    weightInput: weight,
  };

  formData.set('operations', JSON.stringify({
    query: ADD_EVENT_RAW,
    variables,
  }));

  const mapObj = createFileMap(sponsorFileList, !!eventLogo);
  formData.set('map', JSON.stringify(mapObj));

  addFilesToFormData(formData, sponsorFileList, eventLogo);

  const token = getCookie('token');
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await fetch('/api/logout', { method: 'GET' });
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const responseData = await response.json();

  const eventRes = responseData?.data?.createEvent;
  const res = handleResponse({ response: eventRes, setActErr });
  return eventRes?.data?._id || null;
}

function processSponsors(sponsorImgList: IEventSponsorAdd[]) {
  const sponsorFileList: IEventSponsorAdd[] = [];
  const sponsorsInput: IEventSponsorAdd[] = [];

  sponsorImgList.forEach((sponsor) => {
    if (typeof sponsor.logo === 'string') {
      // Skip string logos (already uploaded)
      return;
    }
    if (sponsor.company === APP_NAME) {
      // Skip default sponsor
      return;
    }
    sponsorFileList.push(sponsor);
    sponsorsInput.push({ company: sponsor.company, logo: null });
  });

  return { sponsorsInput, sponsorFileList };
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

function addFilesToFormData(
  formData: FormData, 
  sponsorFileList: IEventSponsorAdd[], 
  eventLogo: Blob | null
) {
  sponsorFileList.forEach((sponsor, index) => {
    if (sponsor.logo instanceof File && sponsor.company) {
      formData.set(`${index}`, sponsor.logo);
    }
  });

  if (eventLogo) {
    formData.set(`${sponsorFileList.length}`, eventLogo);
  }
}