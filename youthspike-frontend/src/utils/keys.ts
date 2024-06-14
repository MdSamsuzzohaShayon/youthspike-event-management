/* eslint-disable import/no-mutable-exports */
const NODE_ENV: string = 'development';
// const NODE_ENV: string = 'production';

const APP_NAME = 'American Spikers League';
let FRONTEND_URL = 'http://localhost:3001';
let ADMIN_FRONTEND_URL = 'http://localhost:3000';
let BACKEND_URL: string = 'http://localhost:4000/graphql';
let SOCKET_URL: string = 'ws://localhost:4000/websocket';

if (NODE_ENV === 'production') {
  BACKEND_URL = 'https://aslsquads.com/graphql';
  SOCKET_URL = 'wss://aslsquads.com/websocket';
  FRONTEND_URL = 'https://aslsquads.com';
  ADMIN_FRONTEND_URL = 'http://admin.aslsquads.com';
}

export { BACKEND_URL, SOCKET_URL, FRONTEND_URL, ADMIN_FRONTEND_URL, NODE_ENV, APP_NAME };
