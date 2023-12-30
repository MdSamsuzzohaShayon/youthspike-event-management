let BACKEND_URL: string = 'http://localhost:4000/graphql';

if (process.env.NODE_ENV === 'production') BACKEND_URL = 'https://aslsquads.com/graphql';


export { BACKEND_URL }
