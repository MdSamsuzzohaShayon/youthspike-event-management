
const NODE_ENV: string  = process.env.NODE_ENV || "production";

let BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aslsquads.com/graphql';
let ADMIN_URL: string = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://admin.aslsquads.com';
let FRONTEND_URL: string = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://aslsquads.com';
let SOCKET_URL: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://api.aslsquads.com/websocket';


const APP_NAME = process.env.NEXT_PUBLIC_ || 'Pro League 2025';


export { NODE_ENV, BACKEND_URL, ADMIN_URL, FRONTEND_URL, APP_NAME, SOCKET_URL };
