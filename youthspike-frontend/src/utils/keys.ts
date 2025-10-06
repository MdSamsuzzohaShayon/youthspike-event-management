/* eslint-disable import/no-mutable-exports */

import { EEnv } from '@/types/elements';

const NODE_ENV: string = process.env.NODE_ENV || EEnv.production;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "American Spikers League";
let FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://aslsquads.com';
let ADMIN_FRONTEND_URL = process.env.NEXT_PUBLIC_ADMIN_FRONTEND_URL || 'http://admin.aslsquads.com';
let BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aslsquads.com/graphql';
let SOCKET_URL: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://api.aslsquads.com/websocket';



export { BACKEND_URL, SOCKET_URL, FRONTEND_URL, ADMIN_FRONTEND_URL, NODE_ENV, APP_NAME };
