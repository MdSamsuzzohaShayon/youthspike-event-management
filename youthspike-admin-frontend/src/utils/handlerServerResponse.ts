function handleServerResponse(response: unknown, queryName: string) {
  if (!response || typeof response !== 'object') {
    throw new Error('Unexpected response from server.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { code, success, message, data } = (response as Record<string, any>)[queryName] || {};

  // Handle unauthorized access
  if (code === 401 || code === 403) {
    throw new Error(message || 'Unauthorized access. Please log in again.');
  }
  if (code >= 400) {
    throw new Error('Unexpected response from server.');
  }

  // Handle known GraphQL/server-side failure
  if (!success || !data) {
    throw new Error(message || 'Failed to fetch data from server.');
  }

  return data;
}

export default handleServerResponse;
