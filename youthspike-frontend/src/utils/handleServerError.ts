interface GraphQLError {
    message: string;
    locations?: { line: number; column: number }[];
    extensions?: {
      code?: string;
      [key: string]: any;
    };
  }
  
  function handleServerResponse(
    response: unknown,
    queryName: string,
    errors?: GraphQLError[]
  ) {
    // Handle top-level GraphQL errors
    if (Array.isArray(errors) && errors.length > 0) {
      const errorMessages = errors.map((e) => e.message).join('; ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }
  
    // Ensure response is valid object
    if (!response || typeof response !== 'object') {
      throw new Error('Unexpected response from server.');
    }
  
    const queryResponse = (response as Record<string, any>)[queryName];
  
    if (!queryResponse) {
      throw new Error(`Missing response for query "${queryName}".`);
    }
  
    const { code, success, message, data } = queryResponse;
  
    if (code === 401 || code === 403) {
      throw new Error(message || 'Unauthorized access. Please log in again.');
    }
  
    if (typeof code === 'number' && code >= 400) {
      throw new Error(message || 'Server responded with an error.');
    }
  
    if (!success || !data) {
      throw new Error(message || 'Failed to fetch data from server.');
    }
  
    return data;
  }
  
  export default handleServerResponse;
  