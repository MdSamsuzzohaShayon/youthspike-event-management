import { EEnv } from "@/types/elements";

const NODE_ENV: EEnv  = EEnv.development as EEnv;
// const NODE_ENV: EEnv  = EEnv.production as EEnv;

let BACKEND_URL: string = 'http://localhost:4000/graphql';
let ADMIN_URL: string = 'http://localhost:3000';
let FRONTEND_URL: string = 'http://localhost:3001';
let SOCKET_URL: string = 'ws://localhost:4000/websocket';


if (NODE_ENV === EEnv.production) {
    BACKEND_URL = 'https://aslsquads.com/graphql';
    ADMIN_URL = 'https://admin.aslsquads.com';
    FRONTEND_URL = 'https://aslsquads.com';
    SOCKET_URL = 'wss://aslsquads.com/websocket';
};

const APP_NAME = 'Youthspike';


export { NODE_ENV, BACKEND_URL, ADMIN_URL, FRONTEND_URL, APP_NAME, SOCKET_URL };
