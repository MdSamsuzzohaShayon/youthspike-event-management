import { GET_LDO_RAW, GET_LDOS, GET_LDOS_RAW } from "@/graphql/director";
import { BACKEND_URL } from "@/utils/keys";

async function getEventDirector(directorId?: string | null, token?: string | null) {
  const body: Record<string, any> = { query: GET_LDO_RAW };

  if (directorId) {
    body.variables = { dId: directorId };
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const { data } = await res.json();

  return data?.getEventDirector?.data || null;
}

async function getEventDirectors() {
  const body: Record<string, any> = { query: GET_LDOS_RAW };


  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const { data } = await res.json();

  return data?.getEventDirectors?.data || null;
}

export { getEventDirector, getEventDirectors };
