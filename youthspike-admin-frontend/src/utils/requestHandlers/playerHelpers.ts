import { BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { IError } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const handleRedirect = async (
  router: AppRouterInstance,
  eventId: string,
  ldoIdUrl: string,
  team: string | null
) => {
  if (team) {
    await router.push(`/${eventId}/teams/${team}/${ldoIdUrl}`);
  } else {
    await router.push(`/${eventId}/players/${ldoIdUrl}`);
  }
  router.refresh();
};

export const sendGraphQLFormData = async (
  query: string,
  variables: Record<string, any>,
  uploadedProfile: File
) => {
  const formData = new FormData();
  formData.set(
    'operations',
    JSON.stringify({ query, variables })
  );
  formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
  formData.set('0', uploadedProfile);

  const token = getCookie('token');
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return await response.json();
};

export const handleResponseCheck = async (
  responseData: any,
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>
) => {
  const successCode = responseData?.code >= 200 && responseData?.code < 300;
  if (!successCode) {
    setActErr({ success: false, message: responseData?.message });
    return false;
  }
  setActErr(null);
  return true;
};
