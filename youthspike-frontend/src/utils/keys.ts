let BACKEND_URL: string = 'http://localhost:4000/graphql';
let SOCKET_URL: string = "ws://localhost:4000/websocket";

if (process.env.NODE_ENV === 'production') {
    BACKEND_URL = 'https://aslsquads.com/graphql';
    SOCKET_URL = "wss://aslsquads.com/websocket";
};

export { BACKEND_URL, SOCKET_URL };