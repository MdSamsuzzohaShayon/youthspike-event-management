import { GET_SYSTEM_DETAILS_RAW } from "@/graphql/director";
import { BACKEND_URL } from "@/utils/keys";

async function getSystemDetails() {
  // const token = getCookie('token');
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${token}`, // Ensure API token is stored securely
    },
    body: JSON.stringify({
      query: GET_SYSTEM_DETAILS_RAW,
    }),
    cache: 'no-store', // Adjust caching as needed
  });

  const { data } = await res.json();

  return data?.getSystemDetails?.data || null;
}


export { getSystemDetails };
