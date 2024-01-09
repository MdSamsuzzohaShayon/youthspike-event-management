let BACKEND_URL: string = 'http://localhost:4000/graphql';
let ADMIN_URL: string = 'http://localhost:3000';
let FRONTEND_URL: string = 'http://localhost:3001';

if (process.env.NODE_ENV === 'production') BACKEND_URL = 'https://aslsquads.com/graphql';
if (process.env.NODE_ENV === 'production') ADMIN_URL = 'https://admin.aslsquads.com';
if (process.env.NODE_ENV === 'production') FRONTEND_URL = 'https://aslsquads.com';


export { BACKEND_URL, ADMIN_URL, FRONTEND_URL };
