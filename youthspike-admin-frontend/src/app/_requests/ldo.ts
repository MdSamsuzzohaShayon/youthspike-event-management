import { GET_LDO_RAW, GET_LDOS, GET_LDOS_RAW } from "@/graphql/director";
import { BACKEND_URL } from "@/utils/keys";
import handleServerResponse from "@/utils/handlerServerResponse";

async function getEventDirector(dId?: string | null, token?: string | null) {
  const body: Record<string, any> = { query: GET_LDO_RAW };

  if (dId) {
    body.variables = { dId: dId };
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




  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getEventDirector', errors);
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


  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getEventDirectors', errors);
}

export { getEventDirector, getEventDirectors };
