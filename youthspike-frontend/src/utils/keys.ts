export const NODE_ENV: string = 'development';
// const NODE_ENV = 'production';

let FRONTEND_URL = "http://localhost:3001";
let BACKEND_URL: string = 'http://localhost:4000/graphql';
let SOCKET_URL: string = "ws://localhost:4000/websocket";

if (NODE_ENV === 'production') {
    BACKEND_URL = 'https://aslsquads.com/graphql';
    SOCKET_URL = "wss://aslsquads.com/websocket";
    FRONTEND_URL = "https://aslsquads.com";
};

export { BACKEND_URL, SOCKET_URL, FRONTEND_URL};