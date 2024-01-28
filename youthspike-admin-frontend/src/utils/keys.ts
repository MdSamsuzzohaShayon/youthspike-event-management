const NODE_ENV: string  = "development";
// const NODE_ENV: string  = "production";

let BACKEND_URL: string = 'http://localhost:4000/graphql';
let ADMIN_URL: string = 'http://localhost:3000';
let FRONTEND_URL: string = 'http://localhost:3001';


if (NODE_ENV === 'production') {
    BACKEND_URL = 'https://aslsquads.com/graphql';
    ADMIN_URL = 'https://admin.aslsquads.com';
    FRONTEND_URL = 'https://aslsquads.com';
}


export { NODE_ENV, BACKEND_URL, ADMIN_URL, FRONTEND_URL };
